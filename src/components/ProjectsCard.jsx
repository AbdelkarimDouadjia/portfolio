import { GitHub, Launch, NewReleases } from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Paper,
  Typography,
  useTheme,
} from "@mui/material";
import React from "react";
import PropTypes from "prop-types";

const ProjectsCard = ({ project, index }) => {
  const theme = useTheme();

  return (
    <section
      style={{
        marginTop: "3rem",
        marginBottom: "3rem",
        maxWidth: "90%",
        marginLeft: "auto",
        marginRight: "auto",
      }}
    >
      <Card
        sx={{
          borderRadius: "15px",
          [theme.breakpoints.up("md")]: { p: 2 },
        }}
      >
        <CardContent
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 3,
            flexDirection: `${index % 2 === 0 ? "row" : "row-reverse"}`,
          }}
        >
          <Box
            sx={{
              position: "relative",
              mt: "auto",
              mb: "auto",
              [theme.breakpoints.down("md")]: { width: "100%" },
            }}
          >
            <Typography
              variant="body1"
              component="p"
              sx={{
                fontWeight: 400,
                color: "#979595",
                fontSize: ".8rem",
                mb: 1,
                ml: 2,
                [theme.breakpoints.up("md")]: {
                  display: "none",
                },
              }}
            >
              <NewReleases
                sx={{
                  width: ".8rem",
                  position: "absolute",
                  left: 0,
                  top: -3,
                }}
              />{" "}
              Click the image to see full view!
            </Typography>
            <Box
              component="div"
              className={`w-full ${
                project.scrollable
                  ? "project-img-movedown"
                  : "project-img-moveright"
              }
			  `}
              sx={{
                background: `url(${`/src/assets/${project.imgPath}`})`,
                backgroundSize: "cover",
                [theme.breakpoints.down("md")]: {
                  width: "100%",
                  height: "auto",
                },
                width: "400px",
              }}
            />
          </Box>
          <Box
            sx={{
              display: "flex",
              [theme.breakpoints.down("md")]: { width: "100%" },
              justifyContent: "space-between",
              alignItems: "center",
              flexDirection: "column",
              flexGrow: 1,
              gap: 2,
            }}
          >
            <Typography
              variant="h3"
              sx={{
                fontFamily: "Poppins",
                fontSize: "2rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterspacing: "-1.5px",
              }}
            >
              {project.title}
            </Typography>
            <Typography
              variant="body1"
              component="p"
              sx={{
                width: "350px",
                [theme.breakpoints.down("md")]: {
                  width: "100%",
                },
                color: "#979595",
                textAlign: "center",
                fontFamily: "Poppins",
                fontSize: "1.6rem",
                fontWeight: 500,
                letterSpacing: "-1px",
              }}
            >
              {project.description}
            </Typography>
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                gap: 1,
                flexWrap: "wrap",
                width: "350px",
                justifyContent: "center",
              }}
            >
              {project.techStack.map((tech, i) => {
                return (
                  <Paper
                    elevation={3}
                    sx={{
                      p: 1,
                      fontWeight: 600,
                      borderRadius: 0,
                    }}
                    key={i}
                    className="!rounded-xl !text-xl"
                  >
                    {tech}
                  </Paper>
                );
              })}
            </Box>
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                gap: 2,
              }}
            >
              <Button
                endIcon={<GitHub />}
                size="large"
                sx={{
                  color: "#000",
                  textTransform: "capitalize",
                  fontFamily: "Poppins",
                  fontWeight: 600,
                  ":hover": { color: "#147efb" },
                }}
                href={project.codeLink}
                target="_blank"
              >
                Code
              </Button>
              <Button
                endIcon={<Launch />}
                size="large"
                sx={{
                  color: "#000",
                  textTransform: "capitalize",
                  fontFamily: "Poppins",
                  fontWeight: 600,
                  ":hover": { color: "#147efb" },
                }}
                href={project.demoLink}
                target="_blank"
              >
                Live Demo
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </section>
  );
};

// PropTypes validation
ProjectsCard.propTypes = {
  project: PropTypes.shape({
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    techStack: PropTypes.arrayOf(PropTypes.string).isRequired,
    imgPath: PropTypes.string.isRequired,
    scrollable: PropTypes.bool,
    codeLink: PropTypes.string.isRequired,
    demoLink: PropTypes.string.isRequired,
  }).isRequired,
  index: PropTypes.number.isRequired,
};

export default ProjectsCard;
