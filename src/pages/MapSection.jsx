const EMBED =
  "https://maps.google.com/maps?q=20.643633,-103.4274082&z=16&ie=UTF8&output=embed";

const MapSection = () => (
  <iframe
    title="Ubicación CLG"
    src={EMBED}
    width="100%"
    height="100%"
    style={{ border: 0, display: "block" }}
    allowFullScreen
    loading="lazy"
    referrerPolicy="no-referrer-when-downgrade"
  />
);

export default MapSection;
