// declare variables
var bsId = [];
    currentSite = [];
    currentUrl = '';
    data = [];
    dataType = '';
    expanded = {};
    firstLoad = true;
    shorts = [];
    shortUrls = [];
    siteId = '';
    warnMessage = '';
    windowUrl = window.location.hostname;

// grab data from background
chrome.runtime.sendMessage(null, {"operation": "passData"}, null, function(state) {
  data = state.sites;
  shorts = state.shorteners;
});

// asyncrhonus loading function
function async(thisFunc, callback) {
  setTimeout(function() {
      thisFunc;
      if (callback) {callback();}
  }, 10);
}

// json validation function
function isJson(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}

// strip urls down to hostname
var cleanUrl = function(url) {
  url = url.replace(new RegExp(/^http\:\/\/|^https\:\/\/|^ftp\:\/\//i), '');
  url = url.replace(new RegExp(/^www\./i), '');
  url = url.replace(new RegExp(/\/(.*)/), '');
  var subDomain = (url.match(new RegExp(/\./g))) ? true : false;
  return(url);
}

// identify current site
function idSite() {
  // currentSite looks for the currentUrl (window.location.hostname) in the JSON data file
  currentUrl = cleanUrl(windowUrl);
  console.log('BS Detector — currentUrl ' + currentUrl);

  if (self == top) {
    currentSite = $.map(data, function(id, obj) {
      if (currentUrl == id.url) return id;
    });
    if (currentSite.length > 0 && (currentUrl == currentSite[0].url || currentUrl == 'www.' + currentSite[0].url)) {
      console.log('BS Detector — currentSite ' + currentSite[0].url);
      siteId = 'badSite';
      dataType = currentSite[0].type;
    } else {
      switch(currentUrl) {
        case 'facebook.com':
          siteId = 'facebook';
          break;
        case 'twitter.com':
          siteId = 'twitter';
          break;
        case currentSite:
          siteId = 'badSite';
          break;
        default:
          siteId = 'none';
          break;
      }
    }
  }
  console.log('BS Detector — siteId ' + siteId);
}

// target links
function targetLinks() {
  // find and label external links
  console.log('BS Detector — currentUrl ' + currentUrl);
  $('a:not([href*="' + currentUrl + '"]:not([href^="#"])').each(function() {
    if (siteId = 'facebook') {
      console.log(this);
      var testLink = decodeURIComponent(this).substring(0, 30);
      var thisUrl = '';
      if (testLink == 'https://l.facebook.com/l.php?u=' || testLink == 'http://l.facebook.com/l.php?u=') {
        thisUrl = decodeURIComponent(this).substring(30).split('&h=', 1);
      }
      if (thisUrl != '') {
        console.log(thisUrl);
        $(this).attr('is-external', true);
        $(this).attr('data-expanded-url', thisUrl);
      }
    }
    var a = new RegExp('/' + window.location.host + '/');
    if (!a.test(this.href)) {
      $(this).attr('is-external', true);
    }
  });

  // get the hostname of a given link
  function getHost(thisElement) {
    var thisUrl = '';
    if ($(thisElement).attr('data-expanded-url')) {
      thisUrl = $(thisElement).attr('data-expanded-url');
    } else {
      thisUrl = $(thisElement).attr('href');
    }
    if (thisUrl != null) {
      thisUrl = cleanUrl(thisUrl);
    }
    return thisUrl;
  }

  // check if short link and if so, add to array
  function checkIfShort(theHost, currentElement) {
    var isShort = $.map(shorts, function(url) {
      if (theHost == url || theHost == 'www.' + url) return true;
    });
    if (isShort == 'true') {
      var shortUrl = $(currentElement).attr('href');
      shortUrls.push(shortUrl);
    }
  }

  // process external links
  $('a[is-external="true"]').each(function() {
    console.log('BS Detector — Processing link ' + this);
    if ($(this).attr('is-bs') != 'true') {
      var urlHost = getHost(this);
      checkIfShort(urlHost, this);

      // check if link is in list of bad domains
      bsId = $.map(data, function(id, obj) {
        if (urlHost == id.url || urlHost == 'www.' + id.url) return id;
      });
      // if link is in bad domain list, tag it
      if (bsId[0]) {
        $(this).attr('is-bs', true);
        $(this).attr('bs-type', bsId[0].type);
        $(this).prepend('💩 ');
      }
    }
  });
}

// function getExpandedLinks() {
//   var shortLinks = shortUrls.join(',');
//   chrome.runtime.sendMessage(null, {"operation": "expandLinks", "shortLinks": shortLinks}, null, function(response) {
//     console.log(shortLinks);
//     if (isJson(response)) {
//       expanded = JSON.parse(response);
//     } else {
//      console.log('BS Detector could not expand shortened link');
//      console.log(response);
//     }
//   });
// }

// generate warning message for a given url
function warningMsg(link) {
  var classType = '';
  switch (dataType) {
    case 'bias':
      classType = 'Extreme Bias';
      break;
    case 'conspiracy':
      classType = 'Conspiracy Theory';
      break;
    case 'fake':
      classType = 'Fake News';
      break;
    case 'junksci':
      classType = 'Junk Science';
      break;
    case 'rumors':
      classType = 'Rumor Mill';
      break;
    case 'satire':
      classType = 'Satire';
      break;
    case 'state':
      classType = 'State News Source';
      break;
    case 'hate':
      classType = 'Hate Group';
      break;
    case 'test':
      classType = 'The Self Agency: Makers of the B.S. Detector';
      break;
    default:
      classType = 'Classification Pending';
      break;
  }
  if (dataType != 'test') {
    warnMessage = '💩 This website is not a reliable news source. Reason: ' + classType;
  } else {
    warnMessage = classType;
  }
}

// if bad site, flag entire site
function flagSite() {
  warningMsg();
  $('body').addClass('shift');
  $('body').prepend('<div class="bs-alert"></div>');
  $('.bs-alert').append('<p>' + warnMessage + '</p>');
}

// generate link warnings
function linkWarning() {
  // flag bad links on fb & twitter
  function flagIt() {
    if (!badlinkWrapper.hasClass('fFlagged')) {
      badlinkWrapper.before('<div class="bs-alert-inline">' + warnMessage + '</div>');
      badlinkWrapper.addClass('fFlagged');
    }
  }

  $('a[is-bs="true"]').each(function() {
    dataType = $(this).attr('bs-type');
    warningMsg(this);

    switch(siteId) {
      case 'facebook':
        if ($(this).parents('._1dwg').length >= 0) {
          badlinkWrapper = $(this).closest('.mtm');
          flagIt();
        }
        if ($(this).parents('.UFICommentContent').length >= 0) {
          badlinkWrapper = $(this).closest('.UFICommentBody');
          flagIt();
        }
        break;
      case 'twitter':
        if ($(this).parents('.tweet').length >= 0) {
          badlinkWrapper = $(this).closest('.js-tweet-text-container');
          flagIt();
        }
        break;
      default:
        $(this).addClass("hint--error hint--large hint--bottom");
        $(this).attr('aria-label', warnMessage);
        break;
    }
  });
}

// watch page for changes
var mutationObserver = new MutationObserver(function(node) {
  trigger();
});

function watchPage() {
  switch(siteId) {
    case 'twitter':
      var observerConfig = {
        attributes: true,
        characterData: false,
        childList: true,
        subtree: true
      }
      break;
    default:
      var observerConfig = {
        attributes: false,
        characterData: false,
        childList: true,
        subtree: true
      }
      break;
  }

  var targetNodes = [];

  switch(siteId) {
    case 'badSite':
      targetNodes = [document.body];
      break;
    case 'facebook':
      targetNodes  = [document.getElementById("contentArea"), document.getElementById("pagelet_timeline_main_column")];
      break;
    case 'twitter':
      targetNodes = [document.getElementById("doc")];
      break;
    case 'none':
      targetNodes = [document.body];
      break;
  }

  $.each(targetNodes, function(id, node) {
    if (node != null) {
      mutationObserver.observe(node, observerConfig);
    }
  });
}

// execution script
function trigger() {
  console.log('BS Detector — Triggered');
  mutationObserver.disconnect();
  idSite();
  if (siteId == 'badSite' && firstLoad) {
    flagSite();
  }
  targetLinks();
  // getExpandedLinks();
  linkWarning();
  watchPage();
  firstLoad = false;
}

// execute on load
chrome.extension.sendMessage({}, function(response) {
    var readyStateCheckInterval = setInterval(function() {
        if (document.readyState == "complete") {
            clearInterval(readyStateCheckInterval);

            // execute
            trigger();
          }
    }, 5);
});
