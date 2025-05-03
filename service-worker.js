chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fetchUrl") {
    const url = request.url;

    fetch(url)
      .then(res => res.text())
      .then(html => {
        sendResponse({ html });
      })
      .catch(err => {
        console.error("Fetch error in background:", err);
        sendResponse({ html: null });
      });

    // Return true to indicate that the response is sent asynchronously
    return true;
  }
});