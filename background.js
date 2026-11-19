// Background – right-click context menu
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'solve-mcq',
    title: '🧠 Solve MCQ',
    contexts: ['selection']
  });
  chrome.contextMenus.create({
    id: 'scan-page',
    title: '🔍 Scan Page for MCQs',
    contexts: ['page']
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'solve-mcq' && info.selectionText) {
    chrome.tabs.sendMessage(tab.id, {
      action: 'solveText',
      text: info.selectionText
    });
  } else if (info.menuItemId === 'scan-page') {
    chrome.tabs.sendMessage(tab.id, {
      action: 'scanPage'
    });
  }
});
