// Helpers
const $ = (sel, parent = document) => parent.querySelector(sel);
const $$ = (sel, parent = document) => Array.from(parent.querySelectorAll(sel));

document.addEventListener('DOMContentLoaded', () => {
  // Year
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Mobile Nav
  const navToggle = $('#navToggle');
  const nav = $('#primaryNav');
  navToggle?.addEventListener('click', () => {
    const open = nav?.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  // Dropdowns (click + keyboard)
  $$('.has-dropdown').forEach(dd => {
    const toggle = $('.dropdown-toggle', dd);
    toggle?.addEventListener('click', () => {
      const isOpen = dd.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    dd.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        dd.classList.remove('open');
        toggle?.setAttribute('aria-expanded', 'false');
      }
    });
  });

  // Filter links in Projects dropdown
  $$('.dropdown-link[data-filter]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const filter = link.getAttribute('data-filter');
      filterGallery(filter);
      // Close nav on mobile
      nav?.classList.remove('open');
      navToggle?.setAttribute('aria-expanded', 'false');
      // Scroll to gallery
      document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // Search
  const searchForm = $('#searchForm');
  const searchInput = $('#searchInput');
  searchForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    performSearch(searchInput?.value || '');
  });
  searchInput?.addEventListener('input', (e) => {
    performSearch(e.target.value);
  });

  // Lightbox
  const lightbox = $('#lightbox');
  const lightboxImg = $('#lightboxImg');
  const lightboxClose = $('#lightboxClose');
  const lightboxPrev = $('#lightboxPrev');
  const lightboxNext = $('#lightboxNext');
  const galleryItems = $$('.project-card img');
  let currentIndex = -1;

  function openLightbox(idx){
    currentIndex = idx;
    const img = galleryItems[currentIndex];
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt;
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
  }
  function closeLightbox(){
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
  }
  function prev(){ if (currentIndex <= 0) currentIndex = galleryItems.length; openLightbox((currentIndex - 1) % galleryItems.length); }
  function next(){ openLightbox((currentIndex + 1) % galleryItems.length); }

  galleryItems.forEach((img, idx) => {
    img.addEventListener('click', () => openLightbox(idx));
    const btn = img.closest('.project-card')?.querySelector('[data-lightbox]');
    btn?.addEventListener('click', () => openLightbox(idx));
  });

  lightboxClose?.addEventListener('click', closeLightbox);
  lightboxPrev?.addEventListener('click', prev);
  lightboxNext?.addEventListener('click', next);
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') prev();
    if (e.key === 'ArrowRight') next();
  });
  lightbox?.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  // Back to top
  const backToTop = $('#backToTop');
  const onScroll = () => {
    if (window.scrollY > 600) backToTop?.classList.add('show'); else backToTop?.classList.remove('show');
  };
  window.addEventListener('scroll', onScroll);
  backToTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  // Contact form validation (client-side)
  const contactForm = $('#contactForm');
  contactForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fields = ['name','email','subject','message'].map(id => ({ el: document.getElementById(id), error: document.querySelector(`#${id} + .error`) }));
    let ok = true;

    fields.forEach(({ el, error }) => {
      const value = (el.value || '').trim();
      let message = '';
      if (!value) message = 'This field is required.';
      if (el.id === 'email' && value){
        const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        if (!valid) message = 'Please enter a valid email.';
      }
      if (message){ ok = false; error.textContent = message; el.setAttribute('aria-invalid', 'true'); }
      else { error.textContent = ''; el.removeAttribute('aria-invalid'); }
    });

    if (ok){
      // Replace with your backend integration
      alert('Thanks! Your message has been sent.');
      contactForm.reset();
    }
  });

  // Utility: filter via category
  function filterGallery(filter){
    $$('.project-card').forEach(card => {
      const cat = card.getAttribute('data-category');
      const show = filter === 'all' || !filter ? true : (cat === filter);
      card.style.display = show ? '' : 'none';
    });
  }

  // Utility: search by title/tags/alt
  function performSearch(query){
    const q = (query || '').toLowerCase();
    $$('.project-card').forEach(card => {
      const title = card.querySelector('h3')?.textContent.toLowerCase() || '';
      const tags = card.querySelector('.tags')?.textContent.toLowerCase() || '';
      const alt = card.querySelector('img')?.alt.toLowerCase() || '';
      const show = !q || title.includes(q) || tags.includes(q) || alt.includes(q);
      card.style.display = show ? '' : 'none';
    });
  }
});
const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// POST route to handle form submission
app.post('/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;

  // Basic validation
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    // Configure mail transporter (use your email credentials)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'your-email@gmail.com',       // Replace with your email
        pass: 'your-email-password'         // Replace with your email password or app password
      }
    });

    // Email content
    const mailOptions = {
      from: email,
      to: 'your-email@gmail.com',          // Where you want to receive the message
      subject: `Contact Form: ${subject}`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`
    };

    // Send email
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Message sent successfully!' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send message.' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

