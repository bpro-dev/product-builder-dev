// LottoBall Web Component
class LottoBall extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static get observedAttributes() {
    return ['number'];
  }

  attributeChangedCallback() {
    this.render();
  }

  connectedCallback() {
    this.render();
  }

  getColorClass(num) {
    if (num <= 10) return 'ball-yellow';
    if (num <= 20) return 'ball-blue';
    if (num <= 30) return 'ball-red';
    if (num <= 40) return 'ball-grey';
    return 'ball-green';
  }

  render() {
    const number = parseInt(this.getAttribute('number')) || 0;
    const colorClass = this.getColorClass(number);
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
          perspective: 1000px;
        }
        .ball {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 1.25rem;
          color: white;
          text-shadow: 0 1px 2px rgba(0,0,0,0.3);
          box-shadow: 
            inset -4px -4px 8px rgba(0,0,0,0.2),
            inset 4px 4px 8px rgba(255,255,255,0.3),
            0 4px 8px rgba(0,0,0,0.1);
          animation: dropIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          user-select: none;
        }
        .ball-yellow { background: radial-gradient(circle at 30% 30%, oklch(0.9 0.15 90), oklch(0.75 0.2 90)); }
        .ball-blue { background: radial-gradient(circle at 30% 30%, oklch(0.75 0.15 240), oklch(0.55 0.2 240)); }
        .ball-red { background: radial-gradient(circle at 30% 30%, oklch(0.75 0.2 30), oklch(0.55 0.25 30)); }
        .ball-grey { background: radial-gradient(circle at 30% 30%, oklch(0.75 0.02 250), oklch(0.55 0.03 250)); }
        .ball-green { background: radial-gradient(circle at 30% 30%, oklch(0.8 0.15 150), oklch(0.6 0.2 150)); }

        @keyframes dropIn {
          0% { transform: scale(0) rotate(-180deg); opacity: 0; }
          100% { transform: scale(1) rotate(0); opacity: 1; }
        }
      </style>
      <div class="ball ${colorClass}">
        ${number}
      </div>
    `;
  }
}

customElements.define('lotto-ball', LottoBall);

// App Logic
document.addEventListener('DOMContentLoaded', () => {
  const ballsContainer = document.getElementById('balls-container');
  const drawBtn = document.getElementById('draw-btn');
  const historyList = document.getElementById('history-list');
  const themeToggle = document.getElementById('theme-toggle');
  const themeIcon = themeToggle.querySelector('.theme-icon');
  const htmlEl = document.documentElement;

  // --- Theme Management ---
  const savedTheme = localStorage.getItem('lotto-theme') || 'light';
  htmlEl.setAttribute('data-theme', savedTheme);
  themeIcon.textContent = savedTheme === 'light' ? '🌙' : '☀️';

  themeToggle.addEventListener('click', () => {
    const currentTheme = htmlEl.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    htmlEl.setAttribute('data-theme', newTheme);
    localStorage.setItem('lotto-theme', newTheme);
    themeIcon.textContent = newTheme === 'light' ? '🌙' : '☀️';
  });

  // --- Lotto Logic ---
  let history = JSON.parse(localStorage.getItem('lotto-history')) || [];

  const updateHistoryUI = () => {
    if (history.length === 0) {
      historyList.innerHTML = '<li class="empty-msg">아직 추첨 이력이 없습니다.</li>';
      return;
    }

    historyList.innerHTML = history.slice().reverse().map((draw) => `
      <li class="history-item">
        <span class="history-date">${draw.date}</span>
        <div class="history-balls">
          ${draw.numbers.map(n => `
            <div class="history-ball ${getBallColorClass(n)}">${n}</div>
          `).join('')}
        </div>
      </li>
    `).join('');
  };

  const getBallColorClass = (num) => {
    if (num <= 10) return 'ball-yellow';
    if (num <= 20) return 'ball-blue';
    if (num <= 30) return 'ball-red';
    if (num <= 40) return 'ball-grey';
    return 'ball-green';
  };

  const generateLottoNumbers = () => {
    const numbers = new Set();
    while (numbers.size < 6) {
      numbers.add(Math.floor(Math.random() * 45) + 1);
    }
    return Array.from(numbers).sort((a, b) => a - b);
  };

  const draw = async () => {
    drawBtn.disabled = true;
    ballsContainer.innerHTML = '';
    
    const newNumbers = generateLottoNumbers();
    
    for (const num of newNumbers) {
      const ball = document.createElement('lotto-ball');
      ball.setAttribute('number', num);
      ballsContainer.appendChild(ball);
      await new Promise(resolve => setTimeout(resolve, 400));
    }

    const now = new Date();
    const dateStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    
    history.push({
      date: dateStr,
      numbers: newNumbers
    });

    if (history.length > 10) history.shift();
    localStorage.setItem('lotto-history', JSON.stringify(history));
    
    updateHistoryUI();
    drawBtn.disabled = false;
  };

  drawBtn.addEventListener('click', draw);
  updateHistoryUI();
});
