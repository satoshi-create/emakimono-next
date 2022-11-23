import GoogleMapReact from "google-map-react";

export default function map() {
  return (
    <div style={{ height: "300px", width: "300px" }}>
      <article>
        <iframe
          src="https://maps.gsi.go.jp/?hc=hc#16/35.705741/139.82671/&base=std&ls=std%7Canaglyphmap_color%2C0.72&blend=0&disp=11&vs=c1g1j0h0k0l0u0t0z0r0s0m0f0"
          frameBorder="0"
          scrolling="no"
          marginHeight="0"
          marginWidth="0"
          passive="true"
        ></iframe>
      </article>
    </div>
  );
}
