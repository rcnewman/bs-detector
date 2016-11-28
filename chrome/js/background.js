var expanded = {};
    siteList = [];
    shortened = '';
    shorts = ["✩.ws", "➡.ws", "1url.com", "adf.ly", "bc.vc", "bit.do", "bit.ly",
              "buzurl.com", "cur.lv", "cutt.us", "db.tt", "goo.gl", "ht.ly",
              "is.gd", "ity.im", "j.mp", "lnkd.in", "ow.ly", "po.st", "q.gs",
              "qr.ae", "qr.net", "scrnch.me", "t.co", "tinyurl.com", "tr.im",
              "trib.al", "tweez.me", "u.bb", "u.to", "v.gd", "vzturl.com",
              "x.co", "zip.net"];
    unshortened = {};

function xhReq(url, callback) {
  var xhr = new XMLHttpRequest();
  xhr.overrideMimeType('application/json');
  xhr.open('GET', url, true);
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4 && xhr.status == '200') {
        callback(xhr.responseText);
    }
  }
  xhr.send(null);
}

function unshorten(url) {
  var toExpand = 'https://unshorten.me/json/' + url;
  xhReq(toExpand, function(response) {
    expanded = response;
  });
  unshortened.push(expanded);
  alert(expanded);
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  switch(request.operation) {
    case 'passData':
      xhReq(chrome.extension.getURL("/data/data.json"), function(file){
        siteList = JSON.parse(file);
      });
      sendResponse({sites: siteList, shorteners: shorts});
      break;
    case 'expandLinks':
      shortened = request.shortLinks;
      alert(shortened);
      $.each(shortened, function(index, url) {
        unshorten(url);
      })
      sendResponse({expandedLinks: unshortened});
      break;
  }
});
