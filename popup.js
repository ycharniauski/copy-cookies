const form = document.getElementById("control-row");
const go = document.getElementById("go");
const toDomainInput = document.getElementById("to_domain");
const success = document.getElementById("success");
const failed = document.getElementById("failed");

const linkEn = document.getElementById("en");
const linkRu = document.getElementById("ru");


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

async function copyCookiesValues() {
  clearMessages();

  try {
    const [{ url }] = await chrome.tabs.query({ active: true, currentWindow: true })
    const cookie = await chrome.cookies.get({ url, name: '__bfx_token' });
    if (!cookie) throw new Error('__bfx_token cookie not found')
    const toDomain = toDomainInput.value || '';
    copyToBuffer(`${toDomain}${cookie.value}`)  
    setSuccess('COPIED!')
  } catch (error) {
    setFailed(`Failed: ${error.message}`);   
  }
}

function handleFormSubmit(event) {
  event.preventDefault();

  setStorageSyncData({
    to_domain: toDomainInput.value || '',
  }).then(() => copyCookiesValues())
}

form.addEventListener("submit", handleFormSubmit);


function setLangs() {
  const langs = ['en', 'ru', 'tr-TR', 'es-EM', 'pt-BR', 'zh-TW', 'zh-CN']
  langs.forEach(lang => {
    const btn = document.getElementById(lang)
    if (btn) {
      btn.addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }).then(([{ id, url }]) => {
          var href = new URL(url);
          href.searchParams.set('locale', lang);
          chrome.tabs.update(id, { url: href.toString() })
          clickEffect(btn)
        })
      })  
    }
  })
}

function setLinks() {
  const list = document.getElementsByClassName('link')
  for (let item of list) {
    item.addEventListener('click', (e) => {
      chrome.tabs.query({ active: true, currentWindow: true }).then(([{ id, url }]) => {
        const href = item.getAttribute('href')
        chrome.tabs.update(id, { url: href })
        clickEffect(btn)
      })
    })
  }
}

function setCopyContent() {
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

function initPopupWindow() {  
  success.hidden = true;
  failed.hidden = true;

  setLangs()
  setCopyContent()
  setLinks()
}

initPopupWindow();

