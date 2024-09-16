import { TabStats, DailyStats, BlockedPattern, BlockedDetail } from './types';
import Chart from 'chart.js/auto';

const blockedCountElement = document.getElementById('blockedCount') as HTMLSpanElement;
const enableBadgesCheckbox = document.getElementById('enableBadges') as HTMLInputElement;
const statsChartCanvas = document.getElementById('statsChart') as HTMLCanvasElement;
const timeRangeSelect = document.getElementById('timeRange') as HTMLSelectElement;
const patternListElement = document.getElementById('patternList') as HTMLUListElement;
const blockedDetailsElement = document.getElementById('blockedDetails') as HTMLUListElement;

let statsChart: Chart;

function updateStats() {
  chrome.storage.local.get(['tabStats', 'dailyStats', 'blockedPatterns', 'blockedDetails'], data => {
    const tabStats: TabStats = data.tabStats || { blocked: 0 };
    const dailyStats: { [date: string]: DailyStats } = data.dailyStats || {};
    const blockedPatterns: BlockedPattern = data.blockedPatterns || {};
    const blockedDetails: BlockedDetail[] = data.blockedDetails || [];
    console.log('Retrieved blocked details from storage:', blockedDetails);
    updateBlockedDetails(blockedDetails);
    blockedCountElement.textContent = tabStats.blocked.toString();
    updateChart(dailyStats);
    updatePatternList(blockedPatterns);
  });
}

function updateChart(dailyStats: { [date: string]: DailyStats }) {
  const timeRange = timeRangeSelect.value;
  const dates = Object.keys(dailyStats).sort();
  let filteredDates = dates;

  if (timeRange === '7days') {
    filteredDates = dates.slice(-7);
  } else if (timeRange === '30days') {
    filteredDates = dates.slice(-30);
  }

  const chartData = {
    labels: filteredDates,
    datasets: [{
      label: 'Blocked Sites',
      data: filteredDates.map(date => dailyStats[date].blocked),
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      borderColor: 'rgba(75, 192, 192, 1)',
      borderWidth: 1
    }]
  };

  if (statsChart) {
    statsChart.destroy();
  }

  statsChart = new Chart(statsChartCanvas, {
    type: 'bar',
    data: chartData,
    options: {
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

function updatePatternList(blockedPatterns: BlockedPattern) {
  patternListElement.innerHTML = '';
  Object.entries(blockedPatterns)
    .sort((a, b) => b[1].count - a[1].count)
    .forEach(([pattern, stats]) => {
      const li = document.createElement('li');
      li.textContent = `${pattern}: ${stats.count} (Last blocked: ${new Date(stats.lastBlocked).toLocaleString()})`;
      patternListElement.appendChild(li);
    });
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
        li.textContent = `${new Date(detail.timestamp).toLocaleString()}: ${detail.url} (Pattern: ${detail.pattern})`;
        blockedDetailsElement.appendChild(li);
      });
  }
  console.log('Blocked details updated in DOM');
}

// Add this new function to listen for storage changes
function listenForStorageChanges() {
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && (changes.tabStats || changes.dailyStats || changes.blockedPatterns || changes.blockedDetails)) {
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

updateStats();
updateSettings();
listenForStorageChanges();
