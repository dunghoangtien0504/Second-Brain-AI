// Scroll reveal animation
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// Form handling
const PAYMENT_CONFIG = {
  bankId: 'MB',
  accountNo: '333303838',
  accountName: 'HOANG TIEN DUNG',
  amount: 299000,
  template: 'compact2',
  transferPrefix: 'SecondBrainAI'
};

function buildVietQrUrl(amount, addInfo) {
  const baseUrl = `https://img.vietqr.io/image/${PAYMENT_CONFIG.bankId}-${PAYMENT_CONFIG.accountNo}-${PAYMENT_CONFIG.template}.png`;
  const query = new URLSearchParams({
    amount: String(amount),
    addInfo: addInfo,
    accountName: PAYMENT_CONFIG.accountName
  });
  return `${baseUrl}?${query.toString()}`;
}

function renderVietQr(amount, transferContent) {
  const qrBox = document.querySelector('.payment-method .qr-placeholder');
  if (!qrBox) return;

  const qrUrl = buildVietQrUrl(amount, transferContent);
  qrBox.innerHTML = `<img src="${qrUrl}" alt="QR chuyển khoản VietQR" style="max-width:100%;height:auto;border-radius:12px;display:block;margin:0 auto;" />`;
}

function handleSubmit() {
  var name = document.getElementById('fullname').value.trim();
  var phone = document.getElementById('phone').value.trim().replace(/\s/g, '');
  var email = document.getElementById('email').value.trim();
  var valid = true;

  document.querySelectorAll('.form-input').forEach(el => el.classList.remove('error'));
  document.querySelectorAll('.form-error').forEach(el => el.classList.remove('show'));

  if (!name || name.length < 2) {
    document.getElementById('fullname').classList.add('error');
    document.getElementById('err-fullname').classList.add('show');
    valid = false;
  }
  if (!phone || !/^0[0-9]{9}$/.test(phone)) {
    document.getElementById('phone').classList.add('error');
    document.getElementById('err-phone').classList.add('show');
    valid = false;
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    document.getElementById('email').classList.add('error');
    document.getElementById('err-email').classList.add('show');
    valid = false;
  }

  if (!valid) return;

  document.getElementById('greetingName').textContent = name;
  document.getElementById('greetingEmail').textContent = email;
  document.getElementById('greetingPhone').textContent = phone;
  document.getElementById('bankNum').textContent = PAYMENT_CONFIG.accountNo;
  document.getElementById('amountDisplay').textContent = PAYMENT_CONFIG.amount.toLocaleString('vi-VN') + 'đ';

  const transferContent = `${PAYMENT_CONFIG.transferPrefix} ${phone}`;
  document.getElementById('transferNote').textContent = transferContent;
  document.getElementById('transferNoteDisplay').textContent = transferContent;
  document.getElementById('confirmEmail').textContent = email;
  renderVietQr(PAYMENT_CONFIG.amount, transferContent);

  document.getElementById('formSection').style.display = 'none';
  document.getElementById('paymentSection').classList.add('show');
  document.getElementById('paymentSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function goBack() {
  document.getElementById('formSection').style.display = 'flex';
  document.getElementById('formSection').style.flexDirection = 'column';
  document.getElementById('paymentSection').classList.remove('show');
}

function copyText(elId, btn) {
  var text = document.getElementById(elId).textContent.replace('đ', '').replace(/\./g, '').trim();
  if (elId === 'amountDisplay') text = String(PAYMENT_CONFIG.amount);
  if (elId === 'transferNote') text = document.getElementById(elId).textContent;
  navigator.clipboard.writeText(text).then(() => {
    btn.textContent = 'Đã copy ✓';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
  }).catch(() => {
    var el = document.getElementById(elId);
    var r = document.createRange();
    r.selectNode(el);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(r);
  });
}

// Smooth scroll for all anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  });
});

// Stagger animation for list items
const staggerObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const items = entry.target.children;
      Array.from(items).forEach((item, i) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';
        item.style.transition = `opacity 0.5s ease ${i * 0.08}s, transform 0.5s ease ${i * 0.08}s`;
        setTimeout(() => {
          item.style.opacity = '1';
          item.style.transform = 'translateY(0)';
        }, 50);
      });
      staggerObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.pain-list, .modules-grid, .stack-items, .promise-cards, .forlist').forEach(el => {
  staggerObserver.observe(el);
});
