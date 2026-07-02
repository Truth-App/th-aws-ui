import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { fetchUsers } from "../store/slices/usersSlice";
import {
  getUserPrivilegesFromList,
  getUserRoleFromList,
  getVisibleDashboardFeaturesByPrivileges,
} from "../constants/dashboardFeatures";

const DashboardFeatureCard = ({ activeFeature = "products" }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const authUser = useSelector((state) => state.user.user);
  const { items: users, status } = useSelector((state) => state.users);

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchUsers());
    }
  }, [dispatch, status]);

  const userRole = useMemo(
    () => getUserRoleFromList(users, authUser?.email),
    [users, authUser?.email],
  );

  const userPrivileges = useMemo(
    () => getUserPrivilegesFromList(users, authUser?.email),
    [users, authUser?.email],
  );

  const visibleFeatures = useMemo(
    () => getVisibleDashboardFeaturesByPrivileges(userPrivileges),
    [userPrivileges],
  );

  return (
    <Card
      style={{
        height: "100%",
        width: "100%",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
        border: "1px solid #e8efeb",
      }}
    >
      <CardContent>
        {userRole && (
          <Typography
            variant="body2"
            style={{
              marginBottom: "12px",
              color: "#165d46",
              fontWeight: 600,
              textAlign: "center",
            }}
          >
            Role: {userRole}
          </Typography>
        )}
        {visibleFeatures.length === 0 && status === "succeeded" && (
          <Typography
            variant="body2"
            style={{ textAlign: "center", color: "#6f7378", marginTop: "1em" }}
          >
            No privileges assigned.
          </Typography>
        )}
        {visibleFeatures.map((feature) => {
          const isActive = activeFeature === feature.id;
          return (
            <Button
              key={feature.id}
              onClick={() => feature.path && navigate(feature.path)}
              size="small"
              variant="contained"
              style={{
                width: "100%",
                margin: "5px 0",
                backgroundColor: isActive ? "#165d46" : "transparent",
                color: isActive ? "#fff" : "#165d46",
                border: "1px solid #165d46",
                boxShadow: isActive ? undefined : "none",
                textTransform: "none",
                fontWeight: "bolder",
              }}
            >
              {feature.label}
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default DashboardFeatureCard;
