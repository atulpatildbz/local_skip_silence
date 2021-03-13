import React, { useState } from "react";
import { parseTimestamps } from "subtitle";
import ReactPlayer from "react-player";
import "./App.css";
import { DEFAULT_DIALOGUE_SPEED, DEFAULT_SILENCE_SPEED } from "./constants";

function App() {
  const [usingLocalVideo, setUsingLocalVideo] = useState(true);
  const [videoFilePath, setVideoPath] = useState(null);
  const [playbackRate, setPlaybackRate] = React.useState(1);
  const [timestampStrings, setTimestampStrings] = useState([]);
  const [dialogueSpeed, setDialogueSpeed] = useState(DEFAULT_DIALOGUE_SPEED);
  const [silenceSpeed, setSilenceSpeed] = useState(DEFAULT_SILENCE_SPEED);
  const [varForSeek, setVarForSeek] = useState(0);
  const [syncInterval, setSyncInterval] = useState(30);
  const [playing, setPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);

  const handleVideoUpload = (event) => {
    setVideoPath(URL.createObjectURL(event.target.files[0]));
  };

  const handleVideoURLChange = (event) => {
    setVideoPath(event.target.value);
  };

  let fileReader,
    i = 0,
    player_ref;

  const resetVideoAndSubtitle = () => {
    setVideoPath(null);
    setTimestampStrings([]);
  };

  const handleFileRead = (e) => {
    const content = fileReader.result;
    const timestamp_content = content
      .split("\n")
      .filter((line) => line.includes("-->"));
    setTimestampStrings(timestamp_content);
  };

  const handleSubtitleUpload = (event) => {
    fileReader = new FileReader();
    fileReader.onloadend = handleFileRead;
    fileReader.readAsText(event.target.files[0]);
  };

  const onProgress = ({ playedSeconds }) => {
    //after changing speed back and forth, the audio video gets out of sync
    //this is one annoying way of syncting audio and video.
    if (parseInt(playedSeconds / syncInterval) !== varForSeek) {
      player_ref.seekTo(playedSeconds);
      setVarForSeek(parseInt(playedSeconds / syncInterval));
      console.log("syncting audio and video");
    }
    // convert seconds to millis
    let playedMillis = playedSeconds * 1000;

    //start the loop from variable i. Set the variable i to j whenever a match is found, so that we don't have to loop from the beginning next time
    for (let j = i; j < timestampStrings.length; j++) {
      //get the obj from timestamp strings
      let obj = parseTimestamps(timestampStrings[j].trim());

      //if played is ahead of current timestamp's start and end, then move to next timestamp
      if (playedMillis > obj.start - 50 && playedMillis > obj.end) {
        continue;
      }
      // if played is less than current timestamp's start, then the part is silent, speed up
      else if (playedMillis < obj.start - 50) {
        setPlaybackRate(silenceSpeed);
        // i = j;
        break;
      }
      // if played is between timestamps start and end, someone is speaking, slow down
      else if (playedMillis > obj.start - 50 && playedMillis < obj.end) {
        setPlaybackRate(dialogueSpeed);
        // i = j;
        break;
      }
    }
  };

  const ref = (player) => {
    player_ref = player;
  };

  return (
    <div>
      {(!videoFilePath || timestampStrings.length === 0) && (
        <div className="options-container">
          <div>
            <label for="video-file">Choose a video: </label>
            <button
              onClick={() => {
                setUsingLocalVideo((val) => !val);
              }}
            >
              {usingLocalVideo ? "Local" : "URL"}
            </button>
            {usingLocalVideo ? (
              <input
                type="file"
                onChange={handleVideoUpload}
                name="video-file"
              />
            ) : (
              <input onChange={handleVideoURLChange} />
            )}
          </div>
          <div>
            <label for="video-file">Choose subtitle : </label>
            <input
              type="file"
              onChange={handleSubtitleUpload}
              name="subtitle-file"
            />
          </div>
        </div>
      )}
      <div className="options-container">
        <div>
          <label>Dialogue speed: </label>
          <input
            type="number"
            name="silent-speed"
            onChange={(e) => {
              setDialogueSpeed(parseFloat(e.target.value));
            }}
            placeholder={dialogueSpeed}
          ></input>
          <label>Silent speed: </label>
          <input
            type="number"
            name="dialog-speed"
            onChange={(e) => {
              setSilenceSpeed(parseFloat(e.target.value));
            }}
            placeholder={silenceSpeed}
          ></input>
        </div>
        <div>
          <label>Sync interval</label>
          <input
            type="number"
            name="sync-interval"
            onChange={(e) => {
              setSyncInterval(parseFloat(e.target.value));
            }}
            placeholder={syncInterval}
          ></input>
        </div>
      </div>
      <div className="player-container">
        <ReactPlayer
          ref={ref}
          url={videoFilePath}
          width="100%"
          height="100%"
          controls={showControls}
          playbackRate={playbackRate}
          onProgress={onProgress}
          progressInterval={10}
          playing={playing}
        />
      </div>
      {videoFilePath && timestampStrings.length !== 0 && (
        <div>
          {!playing && (
            <button
              onClick={() => {
                setPlaying(true);
              }}
            >
              Play
            </button>
          )}
          {playing && (
            <button
              onClick={() => {
                setPlaying(false);
              }}
            >
              Pause
            </button>
          )}
          <button onClick={resetVideoAndSubtitle}>Stop</button>
          <button
            onClick={() => {
              setShowControls((prevControls) => !prevControls);
            }}
          >
            Toggle controls
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
