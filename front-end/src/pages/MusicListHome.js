import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Card,
  Col,
  Row,
  Modal,
  Button,
  Tooltip,
  OverlayTrigger,
} from "react-bootstrap";
import axios from "axios";

import backgroundImage from "../images/bluebackground.png";
import LogoutNavbar from "../navibars/LogoutNavbar";
import StaffNavbar from "../navibars/StaffNavbar";
import changeimage from "../images/changeimage.png";

export default function MusicListHome() {
  const { username } = useParams();
  const localUserRole = localStorage.getItem("userRole");
  const backgroundStyle = {
    backgroundImage: `url(${backgroundImage})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    minHeight: "100vh",
  };

  const [residentDetail, setResidentDetail] = useState({});
  const [musicListIDs, setMusicListIDs] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [selectedPlaylistName, setSelectedPlaylistName] = useState(null);
  const [playlistImages, setPlaylistImages] = useState({
    "Morning Motivation": "",
    "Daily Activity": "",
    "Afternoon Relaxation": "",
    "Sleep Preparation": "",
  });

  useEffect(() => {
    const fetchResidentDetails = async () => {
      try {
        // Fetch user details
        const userResponse = await axios.get(
          "http://127.0.0.1:8000/user/manage/"
        );
        const userDetail = userResponse.data.data.find(
          (user) => user.username === username
        );
        if (userDetail) {
          setResidentDetail(userDetail);
        } else {
          console.log("No user found with the given username");
        }

        // Fetch music list details
        const musicListResponse = await axios.patch(
          "http://127.0.0.1:8000/musiclist/",
          {
            username: username,
          }
        );

        // Note: Based on the provided format, we use musicListResponse.data.data to get the list of music.
        const musicListData = musicListResponse.data.data.filter(
          (musicList) => musicList.userBelongTo === username
        );

        const newMusicListIDs = {};
        musicListData.forEach((musicList) => {
          newMusicListIDs[musicList.musicListName] = musicList.musicListId;
        });

        setMusicListIDs(newMusicListIDs);
      } catch (error) {
        console.error("Error fetching resident details:", error);
      }
    };

    fetchResidentDetails();
  }, [username]);

  useEffect(() => {
    const fetchPlaylistImages = async () => {
      try {
        const response = await axios.patch("http://127.0.0.1:8000/musiclist/", {
          username: username,
        });

        const userPlaylists = response.data.data;
        if (userPlaylists) {
          const fetchedImages = {};
          for (let playlist of userPlaylists) {
            if (playlist.userBelongTo === username) {
              fetchedImages[playlist.musicListName] =
                playlist.musicListProfilePic;
            }
          }
          setPlaylistImages(fetchedImages);
        }
      } catch (error) {
        console.error(`Error fetching playlist images:`, error);
      }
    };
    fetchPlaylistImages();
  }, [username]);

  const handleImageClick = (playlistName) => {
    setSelectedPlaylistName(playlistName);
    setShowModal(true);
  };

  const uploadImage = async () => {
    const file = document.getElementById("fileInput").files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("The file is too large to exceed 5MB!");
      return;
    }
    const validMimeTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!validMimeTypes.includes(file.type)) {
      alert(
        "Invalid file types! Please upload an image in JPG, PNG or GIF format."
      );
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("MusicListID", musicListIDs[selectedPlaylistName]);

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/upload/",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      const updatedImages = { ...playlistImages };
      updatedImages[selectedPlaylistName] = response.data.filepath;
      console.log(response.data);
      console.log(response.data.filepath);
      setPlaylistImages(updatedImages);

      await axios.put("http://127.0.0.1:8000/musiclist/", {
        MusicListID: musicListIDs[selectedPlaylistName],
        musicListProfilePic: response.data.filepath,
      });

      setShowModal(false);
    } catch (error) {
      console.error("Error uploading the image:", error);
    }
  };

  return (
    <div>
      {localUserRole === "staff" ? <StaffNavbar /> : <LogoutNavbar />}
      <div
        style={{
          position: "absolute",
          top: "100px",
          left: "110px",
          color: "black",
          fontSize: "38px",
          fontWeight: "bold",
        }}
      >
        {residentDetail && residentDetail.firstname
          ? `Hello ! ${residentDetail.firstname} ${residentDetail.lastname}`
          : "Hello!"}
      </div>
      <div
        style={backgroundStyle}
        className="d-flex justify-content-center align-items-center"
      >
        <Row>
          {[
            "Morning Motivation",
            "Daily Activity",
            "Afternoon Relaxation",
            "Sleep Preparation",
          ].map((playlistName) => (
            <Col md={3} key={playlistName}>
              <Link
                to={{
                  pathname: `/MusicListHome/${username}/${playlistName.replace(
                    " ",
                    "_"
                  )}`,
                }}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <Card
                  style={{
                    width: "300px",
                    height: "550px",
                    marginBottom: "20px",
                    position: "relative",
                    margin_right: "10px",
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      margin: "auto",
                      width: "150px",
                      height: "150px",
                      marginTop: "50px",
                    }}
                  >
                    <Card.Img
                      variant="top"
                      src={playlistImages[playlistName]}
                      style={{
                        borderRadius: "50%",
                        width: "100%",
                        height: "100%",
                      }}
                    />
                    <OverlayTrigger
                      placement="top"
                      overlay={<Tooltip>Upload new image</Tooltip>}
                    >
                      <div
                        style={{
                          position: "absolute",
                          bottom: 0,
                          right: 0,
                          zIndex: 10,
                          cursor: "pointer",
                          width: "30px",
                          height: "30px",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          handleImageClick(playlistName);
                        }}
                      >
                        <img
                          src={changeimage}
                          alt="Upload"
                          style={{ width: "100%", height: "100%" }}
                        />
                      </div>
                    </OverlayTrigger>
                  </div>

                  <Card.Body className="d-flex justify-content-center align-items-center">
                    <Card.Title
                      style={{ fontSize: "24px", fontWeight: "bold" }}
                    >
                      {playlistName}
                    </Card.Title>
                  </Card.Body>
                </Card>
              </Link>
            </Col>
          ))}
        </Row>
      </div>
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Upload Image for {selectedPlaylistName}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <input type="file" id="fileInput" />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={uploadImage}>
            Upload
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
