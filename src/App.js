import React, { useState, useEffect, useCallback } from "react";
import { parseTimestamps } from "subtitle";
import ReactPlayer from "react-player";
import "./App.css";
import { DEFAULT_DIALOGUE_SPEED, DEFAULT_SILENCE_SPEED, DEFAULT_SYNC_INTERVAL } from "./constants";

function App() {
  const [usingLocalVideo, setUsingLocalVideo] = useState(true);
  const [videoFilePath, setVideoPath] = useState(null);
  const [playbackRate, setPlaybackRate] = React.useState(1);
  const [timestampStrings, setTimestampStrings] = useState([]);
  const [subtitleWords, setSubtitleWords] = useState([]);
  const [currentSubtitle, setCurrentSubtitle] = useState("");
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [dialogueSpeed, setDialogueSpeed] = useState(DEFAULT_DIALOGUE_SPEED);
  const [silenceSpeed, setSilenceSpeed] = useState(DEFAULT_SILENCE_SPEED);
  const [varForSeek, setVarForSeek] = useState(0);
  const [syncInterval, setSyncInterval] = useState(DEFAULT_SYNC_INTERVAL);
  const [playing, setPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);

  const handleUserKeyPress = useCallback((event) => {
    const { key, keyCode } = event;
    if (keyCode === 32) {
      setPlaying((prevState) => !prevState);
    } else if (keyCode === 219) {
      setSilenceSpeed((prevSpeed) => prevSpeed - 0.1);
    } else if (keyCode === 221) {
      setSilenceSpeed((prevSpeed) => prevSpeed + 0.1);
    } else if (keyCode === 186) {
      setDialogueSpeed((prevSpeed) => prevSpeed - 0.1);
    } else if (keyCode === 222) {
      setDialogueSpeed((prevSpeed) => prevSpeed + 0.1);
    } else if (keyCode === 37) {
      // setDialogueSpeed((prevSpeed) => prevSpeed - 0.1);
    } else if (keyCode === 39) {
      // setDialogueSpeed((prevSpeed) => prevSpeed + 0.1);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleUserKeyPress);
    return () => {
      window.removeEventListener("keydown", handleUserKeyPress);
    };
  }, [handleUserKeyPress]);

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
    const content = fileReader.result.split("\n");
    const timestamp_content = [];
    const words_content = [];
    for (let i = 0; i < content.length; i++) {
      if (content[i].includes("-->")) {
        timestamp_content.push(content[i]);
        let temp_content = [];
        for (let j = i + 1; i < content.length; j++) {
          if (content[j][1]) {
            temp_content.push(content[j]);
          } else {
            words_content.push(temp_content.join(". "));
            break;
          }
        }
      }
    }
    setTimestampStrings(timestamp_content);
    setSubtitleWords(words_content);
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
      if (playedMillis > obj.start - LOOKBEHIND_BUFFER_MILLIS && playedMillis > obj.end) {
        continue;
      }
      // if played is less than current timestamp's start, then the part is silent, speed up
      else if (playedMillis < obj.start - LOOKBEHIND_BUFFER_MILLIS) {
        setPlaybackRate(silenceSpeed);
        setCurrentSubtitle("");
        // i = j;
        break;
      }
      // if played is between timestamps start and end, someone is speaking, slow down
      else if (playedMillis > obj.start - LOOKBEHIND_BUFFER_MILLIS && playedMillis < obj.end) {
        setPlaybackRate(dialogueSpeed);
        setCurrentSubtitle(subtitleWords[j]);
        // i = j;
        break;
      }
    }
  };

  const ref = (player) => {
    player_ref = player;
  };

  const handleOptionsInputChange = (e) => {
    switch (e.target.name) {
      case "dialogue-speed":
        setDialogueSpeed(parseFloat(e.target.value) || DEFAULT_DIALOGUE_SPEED);
        break;
      case "silence-speed":
        setSilenceSpeed(parseFloat(e.target.value) || DEFAULT_SILENCE_SPEED);
        break;
      case "sync-interval":
        setSyncInterval(parseFloat(e.target.value) || DEFAULT_SYNC_INTERVAL);
        break;
      default:
        return;
    }
  };

  return (
    <div>
      {(!videoFilePath || timestampStrings.length === 0) && (
        <div className="options-container">
          <div>
            <label htmlFor="video-file">Choose a video: </label>
            <button
              onClick={() => {
                setUsingLocalVideo((val) => !val);
              }}
            >
              {usingLocalVideo ? "Local" : "URL"}
            </button>
            {usingLocalVideo ? (
              <input type="file" onChange={handleVideoUpload} name="video-file" />
            ) : (
              <input onChange={handleVideoURLChange} />
            )}
          </div>
          <div>
            <label htmlFor="subtitle-file">Choose subtitle : </label>
            <input type="file" onChange={handleSubtitleUpload} name="subtitle-file" />
          </div>
        </div>
      )}
      <div className="options-container">
        <div>
          <label>Dialogue speed: </label>
          <input
            type="number"
            name="dialogue-speed"
            onChange={handleOptionsInputChange}
            value={parseFloat(dialogueSpeed.toFixed(2))}
            placeholder={dialogueSpeed}
          ></input>
          <label> Silent speed: </label>
          <input
            type="number"
            name="silence-speed"
            onChange={handleOptionsInputChange}
            value={parseFloat(silenceSpeed.toFixed(2))}
            placeholder={silenceSpeed}
          ></input>
        </div>
        <div>
          <label> Sync interval</label>
          <input
            type="number"
            name="sync-interval"
            onChange={handleOptionsInputChange}
            placeholder={syncInterval}
          ></input>
        </div>
      </div>
      <div className={showSubtitles ? "player-container-with-subtitle" : "player-container"}>
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
      {showSubtitles && <div className="subtitle-container">{currentSubtitle}</div>}
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
          <button
            onClick={() => {
              setShowSubtitles((prev) => !prev);
            }}
          >
            {showSubtitles ? "Hide" : "Show"} subtitles
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
