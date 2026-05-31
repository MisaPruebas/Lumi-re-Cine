export default function Placeholder({ title }) {
  return (
    <>
      <div className="phead">
        <div className="plabel">En construcción</div>
        <div className="ptitle">{title}</div>
        <div className="psub">Migración a React pendiente — próximo turno.</div>
      </div>
      <section>
        <div className="empty">Esta vista aún no se migra a React. El backend ya está disponible.</div>
      </section>
    </>
  );
}
