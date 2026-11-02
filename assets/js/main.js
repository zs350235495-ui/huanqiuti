// 环球梯 (Huanqiu Ladder) 2026 官方交互逻辑

document.addEventListener('DOMContentLoaded', () => {
  // 1. 移动端菜单切换
  const mobileToggle = document.getElementById('mobileMenuToggle');
  const siteHeader = document.querySelector('.site-header');
  if (mobileToggle && siteHeader) {
    mobileToggle.addEventListener('click', () => {
      siteHeader.classList.toggle('mobile-menu-open');
    });
  }

  // 2. 套餐分类切换 (周期订阅 vs 一次性流量包)
  const categoryTabs = document.querySelectorAll('.category-tab');
  const planGrids = document.querySelectorAll('.pricing-grid-group');
  categoryTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      categoryTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.getAttribute('data-target');
      planGrids.forEach(grid => {
        if (grid.id === target) {
          grid.style.display = 'grid';
        } else {
          grid.style.display = 'none';
        }
      });
    });
  });

  // 3. 周期订阅周期折扣切换 (月付 / 季付 / 半年 / 年付)
  const cycleBtns = document.querySelectorAll('.cycle-btn');
  const recurringCards = document.querySelectorAll('.pricing-card[data-price-monthly]');
  
  cycleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      cycleBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cycle = btn.getAttribute('data-cycle'); // monthly, quarterly, semiannual, annual
      
      recurringCards.forEach(card => {
        const monthly = parseFloat(card.getAttribute('data-price-monthly'));
        const isAnnualSpecial = card.getAttribute('data-special-annual');
        const amountEl = card.querySelector('.plan-amount');
        const cycleEl = card.querySelector('.plan-cycle');
        
        if (!amountEl || !cycleEl) return;
        
        if (isAnnualSpecial) {
          // 学生特惠固定年付展示
          if (cycle === 'monthly') {
            amountEl.textContent = '8.00';
            cycleEl.textContent = '/月 (按年折算)';
          } else {
            amountEl.textContent = '96.00';
            cycleEl.textContent = '/年 (年付特惠)';
          }
          return;
        }

        if (cycle === 'monthly') {
          amountEl.textContent = monthly.toFixed(2);
          cycleEl.textContent = '/月';
        } else if (cycle === 'quarterly') {
          // 季付 9折
          const qPrice = (monthly * 3 * 0.9).toFixed(2);
          amountEl.textContent = qPrice;
          cycleEl.textContent = '/季 (9折省现)';
        } else if (cycle === 'semiannual') {
          // 半年付 85折
          const sPrice = (monthly * 6 * 0.85).toFixed(2);
          amountEl.textContent = sPrice;
          cycleEl.textContent = '/半年 (85折)';
        } else if (cycle === 'annual') {
          // 年付 8折
          const aPrice = (monthly * 12 * 0.8).toFixed(2);
          amountEl.textContent = aPrice;
          cycleEl.textContent = '/年 (8折爆省)';
        }
      });
    });
  });

  // 4. FAQ 手风琴展开与收起
  const faqQuestions = document.querySelectorAll('.faq-question');
  faqQuestions.forEach(btn => {
    btn.addEventListener('click', () => {
      const parent = btn.parentElement;
      const isOpen = parent.classList.contains('open');
      const answer = parent.querySelector('.faq-answer');
      
      // 关闭同级其他
      document.querySelectorAll('.faq-item').forEach(item => {
        item.classList.remove('open');
        const ans = item.querySelector('.faq-answer');
        if (ans) ans.style.maxHeight = null;
      });

      if (!isOpen) {
        parent.classList.add('open');
        if (answer) answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });

  // 默认展开第一个 FAQ
  const firstFaq = document.querySelector('.faq-item');
  if (firstFaq) {
    firstFaq.classList.add('open');
    const firstAns = firstFaq.querySelector('.faq-answer');
    if (firstAns) firstAns.style.maxHeight = firstAns.scrollHeight + 'px';
  }

  // 5. 复制优惠码功能
  const copyCouponBtn = document.getElementById('copyCouponBtn');
  if (copyCouponBtn) {
    copyCouponBtn.addEventListener('click', () => {
      const code = 'HQ66';
      navigator.clipboard.writeText(code).then(() => {
        const originalText = copyCouponBtn.textContent;
        copyCouponBtn.textContent = '已复制优惠码 HQ66 !';
        copyCouponBtn.style.background = '#10b981';
        setTimeout(() => {
          copyCouponBtn.textContent = originalText;
          copyCouponBtn.style.background = '';
        }, 2000);
      }).catch(() => {
        prompt('请复制专属7折优惠码：', 'HQ66');
      });
    });
  }

  // 6. 状态看板动态微波动模拟
  const pingElements = document.querySelectorAll('.live-ping');
  if (pingElements.length > 0) {
    setInterval(() => {
      pingElements.forEach(el => {
        const base = parseInt(el.getAttribute('data-base-ping') || '25', 10);
        const jitter = Math.floor(Math.random() * 5) - 2;
        const current = Math.max(12, base + jitter);
        el.textContent = current + 'ms';
      });
    }, 3500);
  }
});
