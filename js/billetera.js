/* ============ TRIKI - PESTAÑA BILLETERA + IDIOMAS ============ */
(function(){
  const $=id=>document.getElementById(id);

  const T={
    es:{
      title:'Billetera', ccTitle:'Billeteras',
      ccDesc:'Conecta tu Telegram Wallet para recibir tus recompensas en USDT.',
      connect:'CONECTAR TELEGRAM WALLET', connected:'✓ Conectada', close:'Cerrar',
      policy:
        '<h3>Bienvenido a TriKi: ¡Juega, Diviértete y Acumula Recompensas Reales!</h3>'+
        '<p>En TriKi valoramos tu tiempo, tu destreza y tu lealtad. Hemos creado una plataforma interactiva donde el entretenimiento y el reproductor de música se unen para ofrecerte una experiencia transparente, segura y totalmente gratificante.</p>'+
        '<h3>💡 ¿Cómo funciona nuestro sistema?</h3>'+
        '<p><b>Proporcionalidad Directa:</b> Nuestro principio es simple y justo: mientras más juegas, más monedas TriKiCoins (TC) y tiempo acumulas. Cada partida jugada y cada meta alcanzada dentro de la aplicación incrementan directamente tu saldo personal.</p>'+
        '<p><b>Recompensas en USDT Real:</b> Todos tus esfuerzos y puntos acumulados se traducen en saldo convertible a USDT real, el cual será transferido directamente a tu Telegram Wallet de forma segura; es el único medio que utilizamos para asignarte tus recompensas.</p>'+
        '<h3>📢 Anuncios, Actualizaciones y Soporte</h3>'+
        '<p>Para mantener la máxima transparencia y la mejor comunicación, informamos de manera clara a medida que la comunidad alcanza las metas.</p>'+
        '<p><b>Canales Oficiales:</b> Toda la información sobre estados de recompensas, nuevos eventos, sorteos y actualizaciones se publica de forma exclusiva en nuestra Comunidad Oficial de Telegram.</p>'
    },
    en:{
      title:'Wallet', ccTitle:'Wallets',
      ccDesc:'Connect your Telegram Wallet to receive your rewards in USDT.',
      connect:'CONNECT TELEGRAM WALLET', connected:'✓ Connected', close:'Close',
      policy:
        '<h3>Welcome to TriKi: Play, Have Fun and Accumulate Real Rewards!</h3>'+
        '<p>At TriKi we value your time, your skill and your loyalty. We have created an interactive platform where entertainment and the music player come together to offer you a transparent, secure and fully rewarding experience.</p>'+
        '<h3>💡 How does our system work?</h3>'+
        '<p><b>Direct Proportionality:</b> Our principle is simple and fair: the more you play, the more TriKiCoins (TC) and time you accumulate. Every game played and every goal reached inside the app directly increases your personal balance.</p>'+
        '<p><b>Real USDT Rewards:</b> All your efforts and accumulated points translate into balance convertible to real USDT, which will be transferred directly to your Telegram Wallet securely; it is the only means we use to assign your rewards.</p>'+
        '<h3>📢 Ads, Updates and Support</h3>'+
        '<p>To maintain maximum transparency and the best communication, we inform clearly as the community reaches its goals.</p>'+
        '<p><b>Official Channels:</b> All information about reward statuses, new events, raffles and updates is published exclusively in our Official Telegram Community.</p>'
    },
    ru:{
      title:'Кошелёк', ccTitle:'Кошельки',
      ccDesc:'Подключите свой Telegram Wallet, чтобы получать награды в USDT.',
      connect:'ПОДКЛЮЧИТЬ TELEGRAM WALLET', connected:'✓ Подключено', close:'Закрыть',
      policy:
        '<h3>Добро пожаловать в TriKi: играй, развлекайся и накапливай реальные награды!</h3>'+
        '<p>В TriKi мы ценим ваше время, ваше мастерство и вашу преданность. Мы создали интерактивную платформу, где развлечения и музыкальный плеер объединяются, чтобы предложить вам прозрачный, безопасный и полностью вознаграждающий опыт.</p>'+
        '<h3>💡 Как работает наша система?</h3>'+
        '<p><b>Прямая пропорциональность:</b> наш принцип прост и справедлив: чем больше вы играете, тем больше TriKiCoins (TC) и времени вы накапливаете. Каждая сыгранная партия и каждая достигнутая цель в приложении напрямую увеличивают ваш личный баланс.</p>'+
        '<p><b>Реальные награды в USDT:</b> все ваши усилия и накопленные очки превращаются в баланс, конвертируемый в реальный USDT, который будет переведён напрямую на ваш Telegram Wallet безопасно; это единственный способ, которым мы начисляем награды.</p>'+
        '<h3>📢 Объявления, обновления и поддержка</h3>'+
        '<p>Для максимальной прозрачности и лучшего общения мы ясно информируем по мере того, как сообщество достигает целей.</p>'+
        '<p><b>Официальные каналы:</b> вся информация о статусах наград, новых событиях, розыгрышах и обновлениях публикуется исключительно в нашем официальном Telegram-сообществе.</p>'
    }
  };

  let lang=localStorage.getItem('trikiLang')||'es';
  let conectada=false;

  function aplicar(){
    const t=T[lang];
    $('bilTitle').textContent=t.title;
    $('ccTitle').textContent=t.ccTitle;
    $('ccDesc').textContent=t.ccDesc;
    $('connectBtn').textContent= conectada? t.connected : t.connect;
    $('policyClose').textContent=t.close;
    $('policyText').innerHTML=t.policy;
    document.querySelectorAll('.lang-btn').forEach(b=>b.classList.toggle('activa', b.dataset.lang===lang));
  }

  // tuerca -> panel de idioma
  $('gearBtn').addEventListener('click',()=>{ $('langPanel').hidden=!$('langPanel').hidden; });
  document.querySelectorAll('.lang-btn').forEach(b=>{
    b.addEventListener('click',()=>{
      lang=b.dataset.lang;
      localStorage.setItem('trikiLang',lang);
      aplicar();
      $('langPanel').hidden=true;
    });
  });

  // botón ? : al abrir la política el ? SE OCULTA para no tapar letras; al cerrar, reaparece
  $('helpBtn').addEventListener('click',()=>{
    $('policyModal').hidden=false;
    $('helpBtn').style.display='none';
  });
  $('policyClose').addEventListener('click',()=>{
    $('policyModal').hidden=true;
    $('helpBtn').style.display='';
  });

  // conectar billetera (prototipo; después se integra Telegram Wallet real)
  $('connectBtn').addEventListener('click',()=>{
    conectada=true;
    aplicar();
  });

  aplicar();
})();
