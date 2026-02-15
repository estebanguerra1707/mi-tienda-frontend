const formatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

export const IndicadorHoy = ({ valor }: { valor: number }) => (
  <div className="shadow p-4 bg-white rounded text-center mb-6">
    <h2 className="font-semibold text-xl">Ganancia Hoy</h2>
      <p className="text-xs sm:text-sm text-slate-600 mt-1 mb-4">
        <em>(Utilidad)</em>
      </p>
     <p className="text-3xl font-bold text-green-600">
      {formatter.format(valor)}
    </p>
  </div>
);
