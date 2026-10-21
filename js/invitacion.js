/* ============ TRIKI - CÓDIGO DE INVITACIÓN ÚNICO ============ */
(function(){
  function init(){
    const DB=window.TrikiDB; if(!DB||!DB.listo) return;
    DB.leer().then(d=>{
      if(!d) return;
      // si llegó con ?inv=CODIGO y aún no tiene invitador, lo registra
      const inv=new URLSearchParams(location.search).get('inv');
      if(inv && !d.invitadoPor){ DB.escribir({ invitadoPor: inv }).catch(()=>{}); }
      // si no tiene código propio, se le crea uno único
      if(!d.codigoInv){
        const cod='TRIKI-'+Math.random().toString(36).slice(2,7).toUpperCase();
        DB.escribir({ codigoInv: cod }).then(()=>pinta(cod)).catch(()=>pinta(cod));
      } else {
        pinta(d.codigoInv);
      }
    }).catch(()=>{});
  }
  function pinta(cod){
    const el=document.getElementById('inviteCode');
    if(el) el.textContent=cod;
  }
  if(window.TrikiDB && window.TrikiDB.listo) init();
  else window.addEventListener('triki-db-listo', init);
})();
