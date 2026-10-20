/* ============ TRIKI - MONEDERO GLOBAL + TIEMPO DE JUEGO ============ */
(function(){
  window.TrikiSaldo = {
    valor: 0,
    listo: false,
    _cbs: [],
    sumar(n){
      this.valor += n;
      this._cbs.forEach(cb=>cb(this.valor));
      if(window.TrikiDB && window.TrikiDB.listo){
        window.TrikiDB.sumarSaldo(n).catch(()=>{});
      }
    },
    fijar(v){ this.valor=v; this._cbs.forEach(cb=>cb(v)); },
    on(cb){ this._cbs.push(cb); cb(this.valor); }
  };

  function iniciar(){
    if(!window.TrikiDB || !window.TrikiDB.listo) return;
    // lee el saldo real y lo mantiene en vivo
    window.TrikiDB.verSaldo(d=>{
      if(d && typeof d.saldo==='number') window.TrikiSaldo.fijar(d.saldo);
    });
    window.TrikiSaldo.listo=true;
    // acumula tiempo de juego cada 10s mientras la app está visible
    setInterval(()=>{
      if(document.visibilityState==='visible' && window.TrikiDB.listo){
        window.TrikiDB.sumarTiempo(10).catch(()=>{});
      }
    },10000);
  }

  if(window.TrikiDB && window.TrikiDB.listo) iniciar();
  else window.addEventListener('triki-db-listo', iniciar);
})();
