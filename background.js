function tryRedirectToGmail(tabId) {
  chrome.cookies.getAll({ domain: '.mail.google.com'
  }, function (cookies) {
      if (cookies.length > 0) {
        setTimeout(async () => {
          chrome.tabs.update(tabId, { url: 'https://mail.google.com/mail/u/0/#inbox' })
        }, 5000)
      }
  });
}


chrome.tabs.onUpdated.addListener(
  function(id, { status }, tab) {
    if (status !== 'complete') return
    const { url } = tab
    if (url?.startsWith('https://ifinex.cloudflareaccess.com/cdn-cgi/access/login')) {
      chrome.scripting.executeScript(
        {
          target: {tabId: id },
          func: () => {
            document.getElementsByName('email')[0].value='eugene.charniauski@bitfinex.com' // Your email
            document.getElementsByClassName('AuthFormLogin')[0].submit()
          },
        }
      );

      tryRedirectToGmail(id)
    }
  }
);
