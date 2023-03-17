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
      setTimeout(async () => { chrome.tabs.update(id, { url: 'https://mail.google.com/mail/u/0/#inbox' }) }, 5000)
    }
  }
);
