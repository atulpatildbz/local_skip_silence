import React, { useState } from "react";
import { parseTimestamps } from "subtitle";
import ReactPlayer from "react-player";

function App() {
  const [videoFilePath, setVideoPath] = useState(null);
  const [playbackRate, setPlaybackRate] = React.useState(1);
  const [timestampStrings, setTimestampStrings] = useState([]);
  const [silentSpeed, setSilentSpeed] = useState(1.4);
  const [dialogueSpeed, setDialogueSpeed] = useState(3.5);
  const [varForSeek, setVarForSeek] = useState(0);

  const handleVideoUpload = (event) => {
    setVideoPath(URL.createObjectURL(event.target.files[0]));
  };

  let fileReader,
    i = 0,
    player_ref;

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
    if (parseInt(playedSeconds / 50) !== varForSeek) {
      player_ref.seekTo(playedSeconds);
      setVarForSeek(parseInt(playedSeconds / 50));
      console.log("syncting audio and video");
    }
    // convert seconds to millis
    let playedMillis = playedSeconds * 1000;

    //start the loop from variable i. Set the variable i to j whenever a match is found, so that we don't have to loop from the beginning next time
    for (let j = i; j < timestampStrings.length; j++) {
      //get the obj from timestamp strings
      let obj = parseTimestamps(timestampStrings[j]);

      //if played is ahead of current timestamp's start and end, then move to next timestamp
      if (playedMillis > obj.start - 50 && playedMillis > obj.end) {
        continue;
      }
      // if played is less than current timestamp's start, then the part is silent, speed up
      else if (playedMillis < obj.start - 50) {
        setPlaybackRate(dialogueSpeed);
        // i = j;
        break;
      }
      // if played is between timestamps start and end, someone is speaking, slow down
      else if (playedMillis > obj.start - 50 && playedMillis < obj.end) {
        setPlaybackRate(silentSpeed);
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
      <div>
        <label for="video-file">Choose a video: </label>
        <input type="file" onChange={handleVideoUpload} name="video-file" />
      </div>
      <div>
        <label for="video-file">Choose subtitle : </label>
        <input
          type="file"
          onChange={handleSubtitleUpload}
          name="subtitle-file"
        />
      </div>
      <div>
        <label>Silent speed: </label>
        <input
          type="number"
          name="silent-speed"
          onChange={(e) => {
            setSilentSpeed(parseFloat(e.target.value));
          }}
        ></input>
        <label>Dialogue speed: </label>
        <input
          type="number"
          name="dialog-speed"
          onChange={(e) => {
            setDialogueSpeed(parseFloat(e.target.value));
          }}
        ></input>
      </div>
      <ReactPlayer
        ref={ref}
        url={videoFilePath}
        width="70%"
        height="50%"
        controls={true}
        playbackRate={playbackRate}
        onProgress={onProgress}
        progressInterval={10}
      />
    </div>
  );
}

export default App;
