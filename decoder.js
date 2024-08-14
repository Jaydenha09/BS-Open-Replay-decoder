const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function readFileAsArrayBuffer(filePath, callback) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      callback(err, null);
    } else {
      const arrayBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
      callback(null, arrayBuffer);
    }
  });
}

function decode(arrayBuffer, completion) {
  const dataView = new DataView(arrayBuffer);
  dataView.pointer = 0;

  const magic = DecodeInt(dataView);
  const version = DecodeUint8(dataView);

  if (version === 1 && magic === 0x442d3d69) {
    const replay = {};

    for (let a = 0; a <= 5; a++) {
      const type = DecodeUint8(dataView);
      switch (type) {
        case 0:
          replay.info = DecodeInfo(dataView);
          break;
        case 1:
          replay.frames = DecodeFrames(dataView);
          break;
        case 2:
          replay.notes = DecodeNotes(dataView);
          break;
        case 3:
          replay.walls = DecodeWalls(dataView);
          break;
        case 4:
          replay.heights = DecodeHeight(dataView);
          break;
        case 5:
          replay.pauses = DecodePauses(dataView);
          break;
      }
    }

    completion(replay);
  } else {
    completion('Error: failed to decode replay');
  }
}

function DecodeInfo(dataView) {
  const result = {};
  result.version = DecodeString(dataView);
  result.gameVersion = DecodeString(dataView);
  result.timestamp = DecodeString(dataView);
  result.playerID = DecodeString(dataView);
  result.playerName = DecodeName(dataView);
  result.platform = DecodeString(dataView);
  result.trackingSystem = DecodeString(dataView);
  result.hmd = DecodeString(dataView);
  result.controller = DecodeString(dataView);
  result.hash = DecodeString(dataView);
  result.songName = DecodeString(dataView);
  result.mapper = DecodeString(dataView);
  result.difficulty = DecodeString(dataView);
  result.score = DecodeInt(dataView);
  result.mode = DecodeString(dataView);
  result.environment = DecodeString(dataView);
  result.modifiers = DecodeString(dataView);
  result.jumpDistance = DecodeFloat(dataView);
  result.leftHanded = DecodeBool(dataView);
  result.height = DecodeFloat(dataView);
  result.startTime = DecodeFloat(dataView);
  result.failTime = DecodeFloat(dataView);
  result.speed = DecodeFloat(dataView);
  return result;
}

function DecodeFrames(dataView) {
  const length = DecodeInt(dataView);
  const result = [];
  for (let i = 0; i < length; i++) {
    const frame = DecodeFrame(dataView);
    if (frame.time !== 0 && (result.length === 0 || frame.time !== result[result.length - 1].time)) {
      result.push(frame);
    }
  }
  return result;
}

function DecodeFrame(dataView) {
  const result = {};
  result.time = DecodeFloat(dataView);
  result.fps = DecodeInt(dataView);
  result.head = DecodeEuler(dataView);
  result.left = DecodeEuler(dataView);
  result.right = DecodeEuler(dataView);
  return result;
}

function DecodeNotes(dataView) {
  const length = DecodeInt(dataView);
  const result = [];
  for (let i = 0; i < length; i++) {
    result.push(DecodeNote(dataView));
  }
  return result;
}

function DecodeWalls(dataView) {
  const length = DecodeInt(dataView);
  const result = [];
  for (let i = 0; i < length; i++) {
    const wall = {};
    wall.wallID = DecodeInt(dataView);
    wall.energy = DecodeFloat(dataView);
    wall.time = DecodeFloat(dataView);
    wall.spawnTime = DecodeFloat(dataView);
    result.push(wall);
  }
  return result;
}

function DecodeHeight(dataView) {
  const length = DecodeInt(dataView);
  const result = [];
  for (let i = 0; i < length; i++) {
    const height = {};
    height.height = DecodeFloat(dataView);
    height.time = DecodeFloat(dataView);
    result.push(height);
  }
  return result;
}

function DecodePauses(dataView) {
  const length = DecodeInt(dataView);
  const result = [];
  for (let i = 0; i < length; i++) {
    const pause = {};
    pause.duration = DecodeLong(dataView);
    pause.time = DecodeFloat(dataView);
    result.push(pause);
  }
  return result;
}

function DecodeNote(dataView) {
  const result = {};
  result.noteID = DecodeInt(dataView);
  result.eventTime = DecodeFloat(dataView);
  result.spawnTime = DecodeFloat(dataView);
  result.eventType = DecodeInt(dataView);
  if (result.eventType === 0 || result.eventType === 1) {
    result.noteCutInfo = DecodeCutInfo(dataView);
  }
  return result;
}

function DecodeCutInfo(dataView) {
  const result = {};
  result.speedOK = DecodeBool(dataView);
  result.directionOK = DecodeBool(dataView);
  result.saberTypeOK = DecodeBool(dataView);
  result.wasCutTooSoon = DecodeBool(dataView);
  result.saberSpeed = DecodeFloat(dataView);
  result.saberDir = DecodeVector3(dataView);
  result.saberType = DecodeInt(dataView);
  result.timeDeviation = DecodeFloat(dataView);
  result.cutDirDeviation = DecodeFloat(dataView);
  result.cutPoint = DecodeVector3(dataView);
  result.cutNormal = DecodeVector3(dataView);
  result.cutDistanceToCenter = DecodeFloat(dataView);
  result.cutAngle = DecodeFloat(dataView);
  result.beforeCutRating = DecodeFloat(dataView);
  result.afterCutRating = DecodeFloat(dataView);
  return result;
}

function DecodeEuler(dataView) {
  const result = {};
  result.position = DecodeVector3(dataView);
  result.rotation = DecodeQuaternion(dataView);
  return result;
}

function DecodeVector3(dataView) {
  const result = {};
  result.x = DecodeFloat(dataView);
  result.y = DecodeFloat(dataView);
  result.z = DecodeFloat(dataView);
  return result;
}

function DecodeQuaternion(dataView) {
  const result = {};
  result.x = DecodeFloat(dataView);
  result.y = DecodeFloat(dataView);
  result.z = DecodeFloat(dataView);
  result.w = DecodeFloat(dataView);
  return result;
}

function DecodeLong(dataView) {
  const result = dataView.getBigInt64(dataView.pointer, true);
  dataView.pointer += 8;
  return result;
}

function DecodeInt(dataView) {
  const result = dataView.getInt32(dataView.pointer, true);
  dataView.pointer += 4;
  return result;
}

function DecodeUint8(dataView) {
  const result = dataView.getUint8(dataView.pointer, true);
  dataView.pointer++;
  return result;
}

function DecodeString(dataView) {
  const length = dataView.getInt32(dataView.pointer, true);
  if (length < 0 || length > 300) {
    dataView.pointer += 1;
    return DecodeString(dataView);
  }
  const enc = new TextDecoder('utf-8');
  const string = enc.decode(new Int8Array(dataView.buffer.slice(dataView.pointer + 4, length + dataView.pointer + 4)));
  dataView.pointer += length + 4;
  return string;
}

function DecodeName(dataView) {
  const length = dataView.getInt32(dataView.pointer, true);
  const enc = new TextDecoder('utf-8');
  let lengthOffset = 0;
  if (length > 0) {
    while (
      dataView.getInt32(length + dataView.pointer + 4 + lengthOffset, true) !== 6 &&
      dataView.getInt32(length + dataView.pointer + 4 + lengthOffset, true) !== 5 &&
      dataView.getInt32(length + dataView.pointer + 4 + lengthOffset, true) !== 8
    ) {
      lengthOffset++;
    }
  }
  const string = enc.decode(new Int8Array(dataView.buffer.slice(dataView.pointer + 4, length + dataView.pointer + 4 + lengthOffset)));
  dataView.pointer += length + 4 + lengthOffset;
  return string;
}

function DecodeFloat(dataView) {
  const result = dataView.getFloat32(dataView.pointer, true);
  dataView.pointer += 4;
  return result;
}

function DecodeBool(dataView) {
  const result = dataView.getUint8(dataView.pointer, true) !== 0;
  dataView.pointer++;
  return result;
}

rl.question('Enter the path to the .bsor file: ', (filePath) => {
  rl.question('Enter the path to save the .json file: ', (outputFilePath) => {
    readFileAsArrayBuffer(filePath, (err, arrayBuffer) => {
      if (err) {
        console.error('Error reading file:', err);
        rl.close();
        return;
      }

      decode(arrayBuffer, (result) => {
        if (typeof result === 'string' && result.startsWith('Error')) {
          console.error('Error decoding file:', result);
        } else {
          fs.writeFile(outputFilePath, JSON.stringify(result, null, 2), (err) => {
            if (err) {
              console.error('Error writing file:', err);
            } else {
              console.log(`Decoded JSON saved to ${outputFilePath}`);
            }
            rl.close();
          });
        }
      });
    });
  });
});