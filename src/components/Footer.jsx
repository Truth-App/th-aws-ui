import { MdEmail, MdPhone, MdLocationOn, MdAccessTime, MdReply } from "react-icons/md";

const blinkitLikeFont = '"Nunito Sans", "Montserrat", "Segoe UI", sans-serif';

const contactItemStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.35em",
  whiteSpace: "nowrap",
};

const Footer = () => {
  return (
    <footer
      style={{
        marginTop: "2em",
        padding: "1.25em 1.25em 1.5em",
        borderTop: "1px solid #e8e8e8",
        backgroundColor: "#ffffff",
      }}
    >
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <h3
          style={{
            margin: "0 0 0.65em",
            fontSize: "0.95rem",
            fontWeight: 400,
            fontFamily: blinkitLikeFont,
            color: "#1a1a1a",
            letterSpacing: "0.04em",
          }}
        >
          CONTACT
        </h3>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "center",
            alignItems: "center",
            gap: "0.35em 1.25em",
            color: "#4a4a4a",
            fontSize: "0.875rem",
            lineHeight: 1.5,
            fontFamily: blinkitLikeFont,
            fontWeight: 400,
          }}
        >
          <div style={contactItemStyle}>
            <MdEmail size={16} color="#165d46" />
            <span>thriftyhome@gmail.com</span>
          </div>
          <div style={contactItemStyle}>
            <MdPhone size={16} color="#165d46" />
            <span>+91 9032065659</span>
          </div>
          <div style={contactItemStyle}>
            <MdLocationOn size={16} color="#165d46" />
            <span>Nunna, Vijayawada, Andhra Pradesh, India</span>
          </div>
          <div style={contactItemStyle}>
            <MdAccessTime size={16} color="#165d46" />
            <span>Mon—Sat: 9am — 6pm IST</span>
          </div>
          <div style={contactItemStyle}>
            <MdReply size={16} color="#165d46" />
            <span>We respond within 24 hours</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
