const success = document.getElementById("success");
const failed = document.getElementById("failed");

function getStorageSyncData(keys) {
  // Immediately return a promise and start asynchronous work
  return new Promise((resolve, reject) => {
    // Asynchronously fetch all data from storage.sync.
    chrome.storage.sync.get(keys, (items) => {
      // Pass any observed errors down the promise chain.
      if (chrome.runtime.lastError) {
        return reject(chrome.runtime.lastError);
      }
      // Pass the data retrieved from storage down the promise chain.
      resolve(items);
    });
  });
}

function setStorageSyncData(data) {
  // Immediately return a promise and start asynchronous work
  return new Promise((resolve, reject) => {
    // Asynchronously fetch all data from storage.sync.
    chrome.storage.sync.set(data, (items) => {
      // Pass any observed errors down the promise chain.
      if (chrome.runtime.lastError) {
        return reject(chrome.runtime.lastError);
      }
      // Pass the data retrieved from storage down the promise chain.
      resolve(items);
    });
  });
}

function copyToBuffer(text){
  var copyFrom = document.createElement("textarea");
  copyFrom.textContent = text;
  document.body.appendChild(copyFrom);
  copyFrom.focus();
  document.execCommand('SelectAll');
  document.execCommand('Copy');
  document.body.removeChild(copyFrom);
}

function clearMessages() {
  failed.textContent = '';
  failed.hidden = true;
  success.textContent = '';
  success.hidden = true;
}


function clickEffect(el) {
  el.classList.add('click-effect');
  setTimeout(() => {
    el.classList.remove('click-effect');
  }, 200)
}

function setSuccess(str) {
  success.textContent = str;
  success.hidden = false;
  setTimeout(clearMessages, 1000)
}

function setFailed(str) {
  failed.textContent = str;
  failed.hidden = false;
  setTimeout(clearMessages, 1000)
}

async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  return tab
}

async function getToken() {
  const { url } = await getCurrentTab()
  const cookie = await chrome.cookies.get({ url, name: '__bfx_token' });
  if (!cookie) throw new Error('__bfx_token cookie not found')
  return cookie.value
}

async function copyCookiesValues() {
  clearMessages();

  try {
    const token = await getToken() 
    const toDomain = toDomainInput.value || '';
    copyToBuffer(`${toDomain}${token}`)  
    setSuccess('COPIED!')
  } catch (error) {
    setFailed(`Failed: ${error.message}`);   
  }
}

function apiPost({ token, url, data }) {
  return new Promise((resolve, reject) => {
    const req = new XMLHttpRequest();
    req.open("POST", url, true);
    req.setRequestHeader('bfx-token', token);
    req.setRequestHeader('content-type','application/json;charset=UTF-8');
    req.onreadystatechange = function() {
      if (this.readyState === XMLHttpRequest.DONE) {
        if (this.status === 200) {
          resolve()
        } else {
          reject()
        }
      }
    }
    req.send(data);
  })
}

async function setSetting(data) {
  const token = await getToken()
  if (!token) throw new Error('__bfx_token cookie not found')

  try {
    await new Promise((resolve, reject) => {
      apiPost({ token, url: "https://api.staging.bitfinex.com/v2/auth/w/settings/set", data })
        .then(resolve)
        .catch(() => {
          apiPost({ token, url: "https://api.bitfinex.com/v2/auth/w/settings/set", data })
            .then(resolve)
            .catch(() => reject())
        })
    })
    setSuccess('Done')
  } catch {
    setFailed('Failed')
  }

  const { id } = await getCurrentTab()
  await chrome.tabs.reload(id)
}


function addSettings () {
  const settings = {
    'sat-mode': '{"settings":{"api:bitfinex_bitcoinViewMode":"SAT"}}',
    'bit-mode': '{"settings":{"api:bitfinex_bitcoinViewMode":"BIT"}}',
    'btc-mode': '{"settings":{"api:bitfinex_bitcoinViewMode":"BTC"}}',
    'dark-theme': '{"settings":{"api:bitfinex_theme_with_mode":"default-theme:dark-mode:default","api:bitfinex_theme":"dark-theme","api:bitfinex_color-saturation-adjustment":100,"api:bitfinex_color-contrast-adjustment":100,"api:bitfinex_color-brightness-adjustment":100}}',
    'light-theme': '{"settings":{"api:bitfinex_theme_with_mode":"default-theme:light-mode:default","api:bitfinex_theme":"light-theme","api:bitfinex_color-saturation-adjustment":100,"api:bitfinex_color-contrast-adjustment":100,"api:bitfinex_color-brightness-adjustment":100}}',
    'colourblind-theme': '{"settings":{"api:bitfinex_theme_with_mode":"colourblind-theme:light-mode:default","api:bitfinex_theme":"light-theme","api:bitfinex_color-saturation-adjustment":100,"api:bitfinex_color-contrast-adjustment":100,"api:bitfinex_color-brightness-adjustment":100}}',
  }
  
  const keys = Object.keys(settings)
  keys.forEach((key) => {
    const btn = document.getElementById(key)
    if (btn) {
      const value = settings[key]
      btn.addEventListener('click', () => {
        setSetting(value)
        clickEffect(btn)
      })
    }
  })
}

function addLinks() {
  const list = document.getElementsByClassName('link')
  for (let item of list) {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      clickEffect(item)
      chrome.tabs.query({ active: true, currentWindow: true }).then(([{ id }]) => {
        const href = item.getAttribute('href')
        if (e.ctrlKey) {
          chrome.tabs.create({ url: href })
        } else {
          chrome.tabs.update(id, { url: href })
        }
      })
    })
  }
}

function addCopyContent() {
  const list = document.getElementsByClassName('copy')
  for (let item of list) {
    item.addEventListener('click', (e) => {
      const value = item.innerText
      copyToBuffer(value)
      setSuccess(`COPIED: ${value}`)
      clickEffect(item)
    })
  }
}

function bindCloudflare() {
  const btn = document.getElementById('cloudflare')
  btn.addEventListener('click', async () => {
    clickEffect(btn)

    const { id, url } = await getCurrentTab()

    if (!url.startsWith('https://ifinex.cloudflareaccess.com/')) return

    chrome.scripting.executeScript(
      {
        target: {tabId: id },
        func: () => {
          document.getElementsByName('email')[0].value='eugene.charniauski@bitfinex.com'
          document.getElementsByClassName('AuthFormLogin')[0].submit()
        },
      }
    );
    setTimeout(async () => { const tab = await getCurrentTab(); chrome.tabs.update(tab.id, { url: 'https://mail.google.com/mail/u/0/#inbox' }) }, 1500)
  })
}

async function initPopupWindow() {  
  success.hidden = true;
  failed.hidden = true;

  addCopyContent()
  addLinks()
  
  addSettings()
  //bindCloudflare()
}

initPopupWindow();



chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    // listen for messages sent from background.js
    //if (request.message === 'hello') {
      console.log('HELLO')
      alert('HELLO')
      // console.log(request.url) // new url is now in content scripts!
    //}
});



// document.addEventListener('DOMContentLoaded', async function() {
	



			
//  chrome.tabs.executeScript(null,{code:"document.getElementById('ap_customer_name').value = ''"});
  //chrome.tabs.executeScript(tab.id, {code:"document.getElementsByName('email')[0].value='xxx1'"});
		
// });

