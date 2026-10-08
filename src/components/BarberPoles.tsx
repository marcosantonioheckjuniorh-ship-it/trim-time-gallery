export function BarberPoles() {
  return (
    <>
      <div className="pole-side pole-side--left" aria-hidden="true">
        <div className="pole">
          <span className="pole-cap pole-cap--top" />
          <span className="pole-glass">
            <span className="pole-stripes" />
          </span>
          <span className="pole-cap pole-cap--bottom" />
        </div>
      </div>
      <div className="pole-side pole-side--right" aria-hidden="true">
        <div className="pole">
          <span className="pole-cap pole-cap--top" />
          <span className="pole-glass">
            <span className="pole-stripes" />
          </span>
          <span className="pole-cap pole-cap--bottom" />
        </div>
      </div>
    </>
  );
}
