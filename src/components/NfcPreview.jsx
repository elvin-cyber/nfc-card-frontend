import { Radio, Smartphone } from "lucide-react";

export default function NfcPreview({ token = "8F72A91C", name = "Your Name", title = "Digital Contact Card" }) {
  return (
    <div className="nfc-preview">
      <div className="nfc-card">
        <div className="nfc-card-glow"></div>
        <div className="nfc-card-top">
          <span>NFC CONNECT</span>
          <Radio size={20} />
        </div>
        <div className="nfc-card-name">{name}</div>
        <div className="nfc-card-title">{title}</div>
        <div className="nfc-card-bottom">
          <span>Tap to connect</span>
          <code>/c/{token}</code>
        </div>
      </div>
      <div className="tap-hint"><Smartphone size={17} /> Tap your phone on the card</div>
    </div>
  );
}