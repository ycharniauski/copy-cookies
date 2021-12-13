const form = document.getElementById("control-row");
const go = document.getElementById("go");
const toDomainInput = document.getElementById("to_domain");
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

function setSuccess(str) {
  success.textContent = str;
  success.hidden = false;
}
function setFailed(str) {
  failed.textContent = str;
  failed.hidden = false;
}

function clearMessages() {
  failed.textContent = '';
  failed.hidden = true;
  success.textContent = '';
  success.hidden = true;
}

async function copyCookiesValues() {
  clearMessages();

  const [{ url }] = await chrome.tabs.query({active: true })
  const cookie = await chrome.cookies.get({ url, name: '__bfx_token' });

  
  if (cookie) {
    const toDomain = toDomainInput.value || '';
    copyToBuffer(`${toDomain}${cookie.value}`)  
    setSuccess('COPIED!')
  } else {
    setFailed(`Failed: __bfx_token cookie not found`);   
  }
  setTimeout(clearMessages, 1000)
}

(async function initPopupWindow() {
  const savedValues = await getStorageSyncData(['to_domain'])
  toDomainInput.value = savedValues.to_domain || '';
  copyCookiesValues()
})();

form.addEventListener("submit", handleFormSubmit);

async function handleFormSubmit(event) {
  event.preventDefault();

  setStorageSyncData({
    to_domain: toDomainInput.value || '',
  })

  copyCookiesValues();
}
