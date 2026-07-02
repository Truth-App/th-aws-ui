import Navbar from "../components/Navbar";
import EditUserProfile from "../components/UserManagement";

const EditProfile = () => (
  <>
    <Navbar />
    <div
      style={{
        padding: "20px",
        maxWidth: "1200px",
        margin: "0 auto",
        minHeight: "70vh",
      }}
    >
      <EditUserProfile profileMode />
    </div>
  </>
);

export default EditProfile;
