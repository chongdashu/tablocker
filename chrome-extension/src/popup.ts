import { BlockedSite } from './types';
import './styles.css';

document.addEventListener('DOMContentLoaded', () => {
  const urlPatternInput = document.getElementById('urlPattern') as HTMLInputElement;
  const addPatternButton = document.getElementById('addPattern') as HTMLButtonElement;
  const patternList = document.getElementById('patternList') as HTMLUListElement;

  addPatternButton.addEventListener('click', addPattern);

  function addPattern() {
    const pattern = urlPatternInput.value.trim();
    if (pattern) {
      chrome.storage.local.get('blockedSites', (data: { blockedSites?: BlockedSite[] }) => {
        const blockedSites: BlockedSite[] = data.blockedSites || [];
        blockedSites.push({ pattern, createdAt: new Date().toISOString() });
        chrome.storage.local.set({ blockedSites }, () => {
          urlPatternInput.value = '';
          renderPatternList();
        });
      });
    }
  }

  function renderPatternList() {
    chrome.storage.local.get('blockedSites', (data: { blockedSites?: BlockedSite[] }) => {
      const blockedSites: BlockedSite[] = data.blockedSites || [];
      patternList.innerHTML = '';
      blockedSites.forEach((site, index) => {
        const li = document.createElement('li');
        li.className = 'flex justify-between items-center';
        li.innerHTML = `
          <span>${site.pattern}</span>
          <button class="text-red-500 hover:text-red-700" data-index="${index}">Remove</button>
        `;
        patternList.appendChild(li);
      });
      addRemoveListeners();
    });
  }

  function addRemoveListeners() {
    const removeButtons = document.querySelectorAll('[data-index]');
    removeButtons.forEach(button => {
      button.addEventListener('click', e => {
        const index = parseInt((e.target as HTMLButtonElement).getAttribute('data-index')!);
        chrome.storage.local.get('blockedSites', (data: { blockedSites?: BlockedSite[] }) => {
          const blockedSites: BlockedSite[] = data.blockedSites || [];
          blockedSites.splice(index, 1);
          chrome.storage.local.set({ blockedSites }, renderPatternList);
        });
      });
    });
  }

  renderPatternList();
});
