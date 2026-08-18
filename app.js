/* app.js — prototype client-side logic using localStorage and a placeholder for Google Apps Script API */
(() => {
  // Change this to your real Google Apps Script endpoint when ready
  const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/REPLACE_WITH_YOUR_ENDPOINT/exec';

  // Admin email that has special powers
  const ADMIN_EMAIL = 'finn.tattersall@gmail.com';

  // Utility: simple id
  const id = () => Date.now().toString(36) + Math.random().toString(36).slice(2,7);

  // Storage key
  const STORAGE_KEY = 'planehub_posts_v1';

  function readPosts(){
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch(e){ return []; }
  }
  function writePosts(posts){ localStorage.setItem(STORAGE_KEY, JSON.stringify(posts)); }

  // Placeholder function to send notification to admin via Google Apps Script (not active in prototype)
  async function notifyAdmin(post){
    // Uncomment and set GOOGLE_APPS_SCRIPT_URL when you have an endpoint
    /*
    await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method:'POST',headers:{'Content-Type':'application/json'},
      body: JSON.stringify({type:'new_post', post})
    });
    */
    console.log('notifyAdmin (placeholder) would send:', post.id);
  }

  // CAPTCHA: render random text on canvas
  const captcha = {
    value: '',
    render(canvas){
      const ctx = canvas.getContext('2d');
      const w = canvas.width, h = canvas.height;
      ctx.fillStyle = '#f3f6fb'; ctx.fillRect(0,0,w,h);
      const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      this.value = Array.from({length:5}, ()=>letters[Math.floor(Math.random()*letters.length)]).join('');
      for(let i=0;i<this.value.length;i++){
        ctx.save();
        ctx.font = `${24 + Math.floor(Math.random()*8)}px sans-serif`;
        ctx.fillStyle = `hsl(${Math.random()*60+200}deg,60%,30%)`;
        ctx.translate(10 + i*26, 30 + (Math.random()*6-3));
        ctx.rotate((Math.random()-0.5)*0.4);
        ctx.fillText(this.value[i],0,0);
        ctx.restore();
      }
      // noise
      for(let i=0;i<10;i++){ ctx.strokeStyle='rgba(0,0,0,0.05)'; ctx.beginPath(); ctx.moveTo(Math.random()*w,Math.random()*h); ctx.lineTo(Math.random()*w,Math.random()*h); ctx.stroke(); }
    }
  };

  // UI: feed page
  function initFeed(){
    const form = document.getElementById('uploadForm');
    const canvas = document.getElementById('captchaCanvas');
    const refresh = document.getElementById('refreshCaptcha');
    const postsWrap = document.getElementById('posts');

    if(canvas) captcha.render(canvas);
    if(refresh) refresh.onclick = ()=>captcha.render(canvas);

    if(form){
      form.onsubmit = async (e)=>{
        e.preventDefault();
        const author = document.getElementById('author').value.trim();
        const email = document.getElementById('email').value.trim();
        const title = document.getElementById('title').value.trim();
        const description = document.getElementById('description').value.trim();
        const fileInput = document.getElementById('file');
        const captchaInput = document.getElementById('captchaInput').value.trim().toUpperCase();
        if(captchaInput !== captcha.value) return alert('Captcha mismatch');
        const file = fileInput.files[0];
        if(!file) return alert('Pick a file');
        const reader = new FileReader();
        reader.onload = async ()=>{
          const posts = readPosts();
          const post = {
            id: id(), author, email, title, description, dataUrl: reader.result,
            type: file.type.startsWith('video') ? 'video' : 'image',
            likes: [], comments: [], followers: [], approved: false, createdAt: Date.now()
          };
          posts.push(post); writePosts(posts);
          await notifyAdmin({id:post.id, title:post.title, author:post.author});
          alert('Uploaded — pending admin approval');
          form.reset(); captcha.render(canvas); renderPosts();
        };
        reader.readAsDataURL(file);
      };
    }

    function renderPosts(){
      postsWrap.innerHTML = '';
      const posts = readPosts().filter(p=>p.approved).sort((a,b)=>b.createdAt-a.createdAt);
      for(const p of posts){
        const tpl = document.getElementById('postTemplate');
        const el = tpl.content.cloneNode(true);
        el.querySelector('.post-title').textContent = p.title;
        el.querySelector('.author').textContent = p.author;
        el.querySelector('.time').textContent = new Date(p.createdAt).toLocaleString();
        const media = el.querySelector('.media');
        if(p.type==='video'){ const vid = document.createElement('video'); vid.controls=true; vid.src=p.dataUrl; media.appendChild(vid); }
        else { const img = document.createElement('img'); img.src = p.dataUrl; media.appendChild(img); }
        el.querySelector('.desc').textContent = p.description;
        const likeBtn = el.querySelector('.likeBtn');
        const likeCount = el.querySelector('.likeCount');
        likeCount.textContent = p.likes.length;
        likeBtn.onclick = ()=>{
          // simple toggle by localStorage anonymous id
          const anon = getAnonId();
          const posts = readPosts(); const post = posts.find(x=>x.id===p.id);
          const idx = post.likes.indexOf(anon);
          if(idx===-1) post.likes.push(anon); else post.likes.splice(idx,1);
          writePosts(posts); renderPosts();
        };
        const followBtn = el.querySelector('.followBtn');
        followBtn.onclick = ()=>{
          const me = getAnonId();
          const posts = readPosts();
          // follow stored per-post author followers list
          const authorKey = `followers:${p.author}`;
          let arr = JSON.parse(localStorage.getItem(authorKey)||'[]');
          if(!arr.includes(me)) { arr.push(me); alert('Following '+p.author); } else { arr = arr.filter(x=>x!==me); alert('Unfollowed '+p.author); }
          localStorage.setItem(authorKey, JSON.stringify(arr));
        };
        const commentToggle = el.querySelector('.commentToggle');
        const commentsWrap = el.querySelector('.comments');
        commentToggle.onclick = ()=>{ commentsWrap.style.display = commentsWrap.style.display==='none' ? 'block' : 'none'; };
        const commentList = el.querySelector('.commentList');
        function renderComments(){ commentList.innerHTML=''; p.comments.forEach(c=>{ const d = document.createElement('div'); d.className='comment'; d.textContent=`${c.author}: ${c.text}`; commentList.appendChild(d); }); }
        renderComments();
        const commentSend = el.querySelector('.commentSend');
        commentSend.onclick = ()=>{
          const input = el.querySelector('.commentInput'); if(!input.value.trim()) return;
          const posts = readPosts(); const post = posts.find(x=>x.id===p.id);
          post.comments.push({id:id(),author:getAnonId(),text:input.value.trim(),time:Date.now()}); writePosts(posts); input.value=''; renderPosts();
        };

        postsWrap.appendChild(el);
      }
    }

    renderPosts();
  }

  function initAdmin(){
    const signInBtn = document.getElementById('adminSignIn');
    const emailInput = document.getElementById('adminEmail');
    const loginMsg = document.getElementById('loginMsg');
    const pendingSection = document.getElementById('pendingSection');
    const pendingList = document.getElementById('pendingList');
    let isAdmin = false;

    function renderPending(){
      pendingList.innerHTML = '';
      const posts = readPosts().filter(p=>!p.approved).sort((a,b)=>b.createdAt-a.createdAt);
      for(const p of posts){
        const el = document.createElement('div'); el.className='post';
        el.innerHTML = `<strong>${escapeHtml(p.title)}</strong> by ${escapeHtml(p.author)} (${escapeHtml(p.email)}) <div class="meta">${new Date(p.createdAt).toLocaleString()}</div>`;
        const media = document.createElement('div'); media.className='media';
        if(p.type==='video'){ const vid=document.createElement('video'); vid.controls=true; vid.src=p.dataUrl; media.appendChild(vid);} else { const img=document.createElement('img'); img.src=p.dataUrl; media.appendChild(img);} 
        el.appendChild(media);
        const btns = document.createElement('div'); btns.className='actions';
        const approve = document.createElement('button'); approve.textContent='Approve'; approve.onclick = ()=>{ if(!confirm('Approve post?')) return; const posts = readPosts(); const post = posts.find(x=>x.id===p.id); post.approved=true; writePosts(posts); renderPending(); alert('Post approved'); };
        const deny = document.createElement('button'); deny.textContent='Deny'; deny.style.background='#c0392b'; deny.onclick = ()=>{ if(!confirm('Deny and delete post?')) return; let posts = readPosts(); posts = posts.filter(x=>x.id!==p.id); writePosts(posts); renderPending(); alert('Post denied and removed'); };
        btns.appendChild(approve); btns.appendChild(deny); el.appendChild(btns);
        pendingList.appendChild(el);
      }
      if(posts.length===0) pendingList.innerHTML = '<p class="note">No pending uploads</p>';
    }

    signInBtn.onclick = ()=>{
      const val = emailInput.value.trim().toLowerCase();
      if(val === ADMIN_EMAIL){ isAdmin=true; loginMsg.textContent='Signed in as admin'; pendingSection.style.display='block'; document.getElementById('login').style.display='none'; renderPending(); }
      else { alert('Not admin email'); }
    };

  }

  function escapeHtml(s){ return (s||'').replace(/[&<>"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;" })[c]); }

  // Anonymous id for likes/comments/follows
  function getAnonId(){ let a = localStorage.getItem('planehub_anon'); if(!a){ a = 'user_'+id(); localStorage.setItem('planehub_anon',a);} return a; }

  // Router
  document.addEventListener('DOMContentLoaded', ()=>{
    if(document.getElementById('uploadForm')) initFeed();
    if(document.getElementById('adminSignIn')) initAdmin();
  });

})();
