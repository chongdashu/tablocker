import { Chart, ChartConfiguration } from 'chart.js/auto';
import {
  BlockedDetail,
  BlockedPattern,
  BlockedPatternStat,
  DailyStat,
  DailyStats,
  SyncStatsRequest,
  TabStats,
} from './types';
import { isPaidUser, syncStats } from './utils';

const blockedCountElement = document.getElementById('blockedCount') as HTMLSpanElement;
const enableBadgesCheckbox = document.getElementById('enableBadges') as HTMLInputElement;
const statsChartCanvas = document.getElementById('statsChart') as HTMLCanvasElement;
const patternsChartCanvas = document.getElementById('patternsChart') as HTMLCanvasElement;
const timeRangeSelect = document.getElementById('timeRange') as HTMLSelectElement;
const blockedDetailsElement = document.getElementById('blockedDetails') as HTMLUListElement;

let statsChart: Chart<'line'>;
let patternsChart: Chart<'pie'>;

// Tab switching functionality
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(button => {
  button.addEventListener('click', () => {
    const tabName = button.getAttribute('data-tab');
    tabButtons.forEach(btn => btn.classList.remove('bg-indigo-100', 'text-indigo-700'));
    tabContents.forEach(content => content.classList.add('hidden'));
    button.classList.add('bg-indigo-100', 'text-indigo-700');
    document.getElementById(`${tabName}-tab`)?.classList.remove('hidden');
  });
});

async function updateStats() {
  chrome.storage.local.get(
    ['tabStats', 'dailyStats', 'blockedPatterns', 'blockedDetails'],
    data => {
      const tabStats: TabStats = data.tabStats || { blocked: 0 };
      const dailyStats: { [date: string]: DailyStats } = data.dailyStats || {};
      const blockedPatterns: BlockedPattern = data.blockedPatterns || {};
      const blockedDetails: BlockedDetail[] = data.blockedDetails || [];
      console.log('Retrieved blocked details from storage:', blockedDetails);

      blockedCountElement.textContent = tabStats.blocked.toString();
      updateCharts(dailyStats, blockedPatterns);
      updateBlockedDetails(blockedDetails);
    }
  );
}

async function updateCharts(
  dailyStats: { [date: string]: DailyStats },
  blockedPatterns: BlockedPattern
) {
  const isPaid = await isPaidUser();
  const paywallOverlay = document.getElementById('paywallOverlay');

  if (isPaid) {
    if (paywallOverlay) paywallOverlay.classList.add('hidden');
  } else {
    if (paywallOverlay) paywallOverlay.classList.remove('hidden');
  }

  const timeRange = timeRangeSelect.value;
  const dates = Object.keys(dailyStats).sort();
  let filteredDates = dates;

  if (timeRange === '7days') {
    filteredDates = dates.slice(-7);
  } else if (timeRange === '30days') {
    filteredDates = dates.slice(-30);
  }

  // Use real data for paid users, mock data for free users
  const chartDates = isPaid
    ? filteredDates
    : ['2023-05-01', '2023-05-02', '2023-05-03', '2023-05-04', '2023-05-05'];
  const chartData = isPaid ? filteredDates.map(date => dailyStats[date].blocked) : [5, 8, 3, 12, 7];

  const lineChartConfig: ChartConfiguration<'line'> = {
    type: 'line',
    data: {
      labels: chartDates,
      datasets: [
        {
          label: 'Blocked Sites',
          data: chartData,
          borderColor: 'rgba(99, 102, 241, 1)', // Indigo color
          backgroundColor: 'rgba(99, 102, 241, 0.2)',
          tension: 0.1,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        x: {
          grid: {
            display: false,
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.1)',
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          mode: 'index',
          intersect: false,
        },
      },
    },
  };

  if (statsChart) {
    statsChart.destroy();
  }

  statsChart = new Chart(statsChartCanvas, lineChartConfig);

  // Update pie chart
  const pieChartLabels = isPaid
    ? Object.keys(blockedPatterns)
    : ['example.com', 'social.net', 'distraction.org', 'timewaste.io'];
  const pieChartData = isPaid
    ? Object.values(blockedPatterns).map(pattern => pattern.count)
    : [15, 8, 12, 5];

  const pieChartConfig: ChartConfiguration<'pie'> = {
    type: 'pie',
    data: {
      labels: pieChartLabels,
      datasets: [
        {
          data: pieChartData,
          backgroundColor: [
            'rgba(255, 99, 132, 0.8)', // Red
            'rgba(54, 162, 235, 0.8)', // Blue
            'rgba(255, 206, 86, 0.8)', // Yellow
            'rgba(75, 192, 192, 0.8)', // Teal
          ],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'right',
        },
        tooltip: {
          callbacks: {
            label: context => {
              const label = context.label || '';
              const value = context.parsed || 0;
              const total = context.dataset.data.reduce(
                (acc: number, data: number) => acc + data,
                0
              );
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: ${value} (${percentage}%)`;
            },
          },
        },
      },
    },
  };

  if (patternsChart) {
    patternsChart.destroy();
  }

  patternsChart = new Chart(patternsChartCanvas, pieChartConfig);
}

function updateBlockedDetails(blockedDetails: BlockedDetail[]) {
  console.log('Updating blocked details:', blockedDetails);
  blockedDetailsElement.innerHTML = '';
  if (blockedDetails.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'No blocked details available.';
    li.className = 'text-gray-500';
    blockedDetailsElement.appendChild(li);
  } else {
    blockedDetails
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 50) // Limit to the most recent 50 entries
      .forEach(detail => {
        const li = document.createElement('li');
        li.textContent = `${new Date(detail.timestamp).toLocaleString()}: ${detail.url} (Pattern: ${
          detail.pattern
        })`;
        blockedDetailsElement.appendChild(li);
      });
  }
  console.log('Blocked details updated in DOM');
}

function listenForStorageChanges() {
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (
      namespace === 'local' &&
      (changes.tabStats || changes.dailyStats || changes.blockedPatterns || changes.blockedDetails)
    ) {
      updateStats();
    }
  });
}

function updateSettings() {
  chrome.storage.sync.get('settings', data => {
    const settings = data.settings || { enableBadges: true };
    enableBadgesCheckbox.checked = settings.enableBadges;
  });
}

enableBadgesCheckbox.addEventListener('change', () => {
  chrome.storage.sync.set({
    settings: { enableBadges: enableBadgesCheckbox.checked },
  });
});

timeRangeSelect.addEventListener('change', updateStats);

// Add this new function to handle stats syncing
async function handleSyncStats() {
  const syncButton = document.getElementById('syncButton') as HTMLButtonElement;
  const syncText = syncButton.querySelector('.sync-text') as HTMLSpanElement;
  const spinner = syncButton.querySelector('svg') as SVGElement;

  try {
    // Disable button and show spinner
    syncButton.disabled = true;
    syncButton.classList.add('opacity-50', 'cursor-not-allowed');
    syncText.classList.add('hidden');
    spinner.classList.remove('hidden');

    const tabStats = (await chrome.storage.local.get('tabStats')) as { tabStats: TabStats };
    const dailyStats = (await chrome.storage.local.get('dailyStats')) as {
      dailyStats: { [date: string]: DailyStats };
    };
    const blockedPatternStats = (await chrome.storage.local.get('blockedPatterns')) as {
      blockedPatterns: BlockedPattern;
    };

    const syncRequest: SyncStatsRequest = {
      user_stats: {
        total_tabs_blocked: tabStats.tabStats?.blocked || 0,
        last_updated: new Date().toISOString(),
      },
      daily_stats: Object.entries(dailyStats.dailyStats || {}).map(
        ([date, stats]): DailyStat => ({
          date,
          tabs_blocked: stats.blocked,
        })
      ),
      blocked_pattern_stats: Object.entries(blockedPatternStats.blockedPatterns || {}).map(
        ([pattern, stats]): BlockedPatternStat => ({
          pattern,
          count: stats.count,
        })
      ),
    };

    const response = await syncStats(syncRequest);
    if (response.success) {
      setStatus('Stats synced successfully', 'success');
      updateLastSyncTime();
    } else {
      throw new Error('Sync was not successful');
    }
  } catch (error) {
    console.error('Error syncing stats:', error);
    setStatus('Failed to sync stats', 'error');
  } finally {
    // Re-enable button and hide spinner
    syncButton.disabled = false;
    syncButton.classList.remove('opacity-50', 'cursor-not-allowed');
    syncText.classList.remove('hidden');
    spinner.classList.add('hidden');
  }
}

// Implement the setStatus method
function setStatus(message: string, type: string) {
  const statusBar = document.getElementById('statusBar');
  const statusIcon = document.getElementById('statusIcon');
  const statusMessage = document.getElementById('statusMessage');

  if (statusBar && statusIcon && statusMessage) {
    statusBar.classList.remove('hidden');
    statusMessage.textContent = message;

    if (type === 'success') {
      statusIcon.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>';
      statusBar.style.backgroundColor = '#10B981';
    } else if (type === 'error') {
      statusIcon.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>';
      statusBar.style.backgroundColor = '#EF4444';
    } else {
      statusIcon.innerHTML = '';
      statusBar.style.backgroundColor = '';
    }
  }
}

function updateLastSyncTime() {
  const lastSyncElement = document.getElementById('lastSync');
  if (lastSyncElement) {
    const now = new Date();
    lastSyncElement.textContent = `Last synced: ${now.toLocaleString()}`;
    chrome.storage.local.set({ lastSyncTime: now.toISOString() });
  }
}

// Modify the existing initializeUI function
function initializeUI() {
  updateStats();
  updateSettings();
  listenForStorageChanges();

  // Set Analytics tab as active by default
  const analyticsTab = document.querySelector('[data-tab="analytics"]') as HTMLElement;
  analyticsTab.click();

  // Add sync button event listener
  const syncButton = document.getElementById('syncButton') as HTMLButtonElement;
  syncButton.addEventListener('click', handleSyncStats);

  // Load and display last sync time
  chrome.storage.local.get('lastSyncTime', result => {
    const lastSyncElement = document.getElementById('lastSync');
    if (lastSyncElement && result.lastSyncTime) {
      const lastSync = new Date(result.lastSyncTime);
      lastSyncElement.textContent = `Last synced: ${lastSync.toLocaleString()}`;
    }
  });

  // Set up event listeners
  enableBadgesCheckbox.addEventListener('change', () => {
    chrome.storage.sync.set({
      settings: { enableBadges: enableBadgesCheckbox.checked },
    });
  });

  timeRangeSelect.addEventListener('change', updateStats);
}

// Initialize the page
document.addEventListener('DOMContentLoaded', async () => {
  const proStatus = document.getElementById('proStatus') as HTMLSpanElement;
  const isPaid = await isPaidUser();
  console.warn('isPaid=', isPaid);

  if (isPaid) {
    proStatus.classList.remove('hidden');
  }

  initializeUI();
});
