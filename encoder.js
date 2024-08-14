const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function encode(replay, completion) {
  const bufferSize = calculateBufferSize(replay);
  const buffer = new ArrayBuffer(bufferSize);
  const dataView = new DataView(buffer);
  let pointer = 0;

  pointer = EncodeInt(dataView, pointer, 0x442d3d69); // Magic number
  pointer = EncodeUint8(dataView, pointer, 1); // Version

  for (const [key, value] of Object.entries(replay)) {
    switch (key) {
      case 'info':
        pointer = EncodeUint8(dataView, pointer, 0);
        pointer = EncodeInfo(dataView, pointer, value);
        break;
      case 'frames':
        pointer = EncodeUint8(dataView, pointer, 1);
        pointer = EncodeFrames(dataView, pointer, value);
        break;
      case 'notes':
        pointer = EncodeUint8(dataView, pointer, 2);
        pointer = EncodeNotes(dataView, pointer, value);
        break;
      case 'walls':
        pointer = EncodeUint8(dataView, pointer, 3);
        pointer = EncodeWalls(dataView, pointer, value);
        break;
      case 'heights':
        pointer = EncodeUint8(dataView, pointer, 4);
        pointer = EncodeHeight(dataView, pointer, value);
        break;
      case 'pauses':
        pointer = EncodeUint8(dataView, pointer, 5);
        pointer = EncodePauses(dataView, pointer, value);
        break;
    }
  }

  completion(buffer.slice(0, pointer));
}

function calculateBufferSize(replay) {
  // Estimate the buffer size based on the JSON object
  let size = 1000; // Base size
  size += JSON.stringify(replay).length * 2; // Approximation
  return size;
}

function EncodeInfo(dataView, pointer, info) {
  pointer = EncodeString(dataView, pointer, info.version);
  pointer = EncodeString(dataView, pointer, info.gameVersion);
  pointer = EncodeString(dataView, pointer, info.timestamp);
  pointer = EncodeString(dataView, pointer, info.playerID);
  pointer = EncodeString(dataView, pointer, info.playerName);
  pointer = EncodeString(dataView, pointer, info.platform);
  pointer = EncodeString(dataView, pointer, info.trackingSystem);
  pointer = EncodeString(dataView, pointer, info.hmd);
  pointer = EncodeString(dataView, pointer, info.controller);
  pointer = EncodeString(dataView, pointer, info.hash);
  pointer = EncodeString(dataView, pointer, info.songName);
  pointer = EncodeString(dataView, pointer, info.mapper);
  pointer = EncodeString(dataView, pointer, info.difficulty);
  pointer = EncodeInt(dataView, pointer, info.score);
  pointer = EncodeString(dataView, pointer, info.mode);
  pointer = EncodeString(dataView, pointer, info.environment);
  pointer = EncodeString(dataView, pointer, info.modifiers);
  pointer = EncodeFloat(dataView, pointer, info.jumpDistance);
  pointer = EncodeBool(dataView, pointer, info.leftHanded);
  pointer = EncodeFloat(dataView, pointer, info.height);
  pointer = EncodeFloat(dataView, pointer, info.startTime);
  pointer = EncodeFloat(dataView, pointer, info.failTime);
  pointer = EncodeFloat(dataView, pointer, info.speed);
  return pointer;
}

function EncodeFrames(dataView, pointer, frames) {
  pointer = EncodeInt(dataView, pointer, frames.length);
  for (const frame of frames) {
    pointer = EncodeFrame(dataView, pointer, frame);
  }
  return pointer;
}

function EncodeFrame(dataView, pointer, frame) {
  pointer = EncodeFloat(dataView, pointer, frame.time);
  pointer = EncodeInt(dataView, pointer, frame.fps);
  pointer = EncodeEuler(dataView, pointer, frame.head);
  pointer = EncodeEuler(dataView, pointer, frame.left);
  pointer = EncodeEuler(dataView, pointer, frame.right);
  return pointer;
}

function EncodeNotes(dataView, pointer, notes) {
  pointer = EncodeInt(dataView, pointer, notes.length);
  for (const note of notes) {
    pointer = EncodeNote(dataView, pointer, note);
  }
  return pointer;
}

function EncodeNote(dataView, pointer, note) {
  pointer = EncodeInt(dataView, pointer, note.noteID);
  pointer = EncodeFloat(dataView, pointer, note.eventTime);
  pointer = EncodeFloat(dataView, pointer, note.spawnTime);
  pointer = EncodeInt(dataView, pointer, note.eventType);
  if (note.noteCutInfo) {
    pointer = EncodeCutInfo(dataView, pointer, note.noteCutInfo);
  }
  return pointer;
}

function EncodeWalls(dataView, pointer, walls) {
  pointer = EncodeInt(dataView, pointer, walls.length);
  for (const wall of walls) {
    pointer = EncodeInt(dataView, pointer, wall.wallID);
    pointer = EncodeFloat(dataView, pointer, wall.energy);
    pointer = EncodeFloat(dataView, pointer, wall.time);
    pointer = EncodeFloat(dataView, pointer, wall.spawnTime);
  }
  return pointer;
}

function EncodeHeight(dataView, pointer, heights) {
  pointer = EncodeInt(dataView, pointer, heights.length);
  for (const height of heights) {
    pointer = EncodeFloat(dataView, pointer, height.height);
    pointer = EncodeFloat(dataView, pointer, height.time);
  }
  return pointer;
}

function EncodePauses(dataView, pointer, pauses) {
  pointer = EncodeInt(dataView, pointer, pauses.length);
  for (const pause of pauses) {
    pointer = EncodeLong(dataView, pointer, pause.duration);
    pointer = EncodeFloat(dataView, pointer, pause.time);
  }
  return pointer;
}

function EncodeCutInfo(dataView, pointer, cutInfo) {
  pointer = EncodeBool(dataView, pointer, cutInfo.speedOK);
  pointer = EncodeBool(dataView, pointer, cutInfo.directionOK);
  pointer = EncodeBool(dataView, pointer, cutInfo.saberTypeOK);
  pointer = EncodeBool(dataView, pointer, cutInfo.wasCutTooSoon);
  pointer = EncodeFloat(dataView, pointer, cutInfo.saberSpeed);
  pointer = EncodeVector3(dataView, pointer, cutInfo.saberDir);
  pointer = EncodeInt(dataView, pointer, cutInfo.saberType);
  pointer = EncodeFloat(dataView, pointer, cutInfo.timeDeviation);
  pointer = EncodeFloat(dataView, pointer, cutInfo.cutDirDeviation);
  pointer = EncodeVector3(dataView, pointer, cutInfo.cutPoint);
  pointer = EncodeVector3(dataView, pointer, cutInfo.cutNormal);
  pointer = EncodeFloat(dataView, pointer, cutInfo.cutDistanceToCenter);
  pointer = EncodeFloat(dataView, pointer, cutInfo.cutAngle);
  pointer = EncodeFloat(dataView, pointer, cutInfo.beforeCutRating);
  pointer = EncodeFloat(dataView, pointer, cutInfo.afterCutRating);
  return pointer;
}

function EncodeEuler(dataView, pointer, euler) {
  pointer = EncodeVector3(dataView, pointer, euler.position);
  pointer = EncodeQuaternion(dataView, pointer, euler.rotation);
  return pointer;
}

function EncodeVector3(dataView, pointer, vector) {
  pointer = EncodeFloat(dataView, pointer, vector.x);
  pointer = EncodeFloat(dataView, pointer, vector.y);
  pointer = EncodeFloat(dataView, pointer, vector.z);
  return pointer;
}

function EncodeQuaternion(dataView, pointer, quaternion) {
  pointer = EncodeFloat(dataView, pointer, quaternion.x);
  pointer = EncodeFloat(dataView, pointer, quaternion.y);
  pointer = EncodeFloat(dataView, pointer, quaternion.z);
  pointer = EncodeFloat(dataView, pointer, quaternion.w);
  return pointer;
}

function EncodeLong(dataView, pointer, value) {
  dataView.setBigInt64(pointer, BigInt(value), true);
  return pointer + 8;
}

function EncodeInt(dataView, pointer, value) {
  dataView.setInt32(pointer, value, true);
  return pointer + 4;
}

function EncodeUint8(dataView, pointer, value) {
  dataView.setUint8(pointer, value);
  return pointer + 1;
}

function EncodeString(dataView, pointer, value) {
  const enc = new TextEncoder();
  const encoded = enc.encode(value);
  pointer = EncodeInt(dataView, pointer, encoded.length);
  new Uint8Array(dataView.buffer).set(encoded, pointer);
  return pointer + encoded.length;
}

function EncodeFloat(dataView, pointer, value) {
  dataView.setFloat32(pointer, value, true);
  return pointer + 4;
}

function EncodeBool(dataView, pointer, value) {
  dataView.setUint8(pointer, value ? 1 : 0);
  return pointer + 1;
}

rl.question('Enter the path to the JSON file: ', (jsonFilePath) => {
  rl.question('Enter the path to save the .bsor file: ', (bsorFilePath) => {
    fs.readFile(jsonFilePath, 'utf8', (err, jsonData) => {
      if (err) {
        console.error('Error reading JSON file:', err);
        rl.close();
        return;
      }

      try {
        const replay = JSON.parse(jsonData);
        encode(replay, (buffer) => {
          fs.writeFile(bsorFilePath, Buffer.from(buffer), (err) => {
            if (err) {
              console.error('Error writing .bsor file:', err);
            } else {
              console.log(`.bsor file saved to ${bsorFilePath}`);
            }
            rl.close();
          });
        });
      } catch (parseErr) {
        console.error('Error parsing JSON:', parseErr);
        rl.close();
      }
    });
  });
});