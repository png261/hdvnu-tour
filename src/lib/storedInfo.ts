import { writable, derived } from 'svelte/store';
import type { HotSpot, PannellumSettings, PannellumSetup, Scene } from '$lib/types';
export const pannellumViewer = writable<any>();

export const selectedFile = writable(null);
export const viewport = writable<{ yaw: number; pitch: number }>({ yaw: 0, pitch: 0 });
export const hotSpotInfo = writable<HotSpot[]>([]); // Don't use! Use hotSpotsList, a dictionary, listed below
export const hotSpotsList = writable<Record<string, HotSpot>>({});

export const selectedHotSpot = writable<string>('');
export const selectedScene = writable<string>('');
export const reinitViewerTrigger = writable<number>(0);

export const viewerSettings = writable({
	compass: false,
	autoRotate: false,
	lookAtSelected: true,
	panoramaPaneSize: 50,
	precision: '1',
	developmentMode: true
});

export const clickedLocation = writable<{ yaw: number; pitch: number }>();
export const initialConfig = writable<PannellumSettings>({
	firstScene: '64b60aeb033a205573dd8d59',
	autoLoad: true,
	sceneFadeDuration: 1000,
	showControls: false,
	backgroundSound: 'https://smarttravel-vr.mobifone.vn/vr-api/uploads/user/6417e3cfafa35e54a1da0e50/media/asset/FN6N9rFnt3HilZPvh7wJ.mp3',
	showControlBar: true,
	logoImage: ''
});
export const scenes = writable<Record<string, Scene>>({
  "64b60aeb033a205573dd8d56": {
    "title": "Sân Nghi Lễ",
    "hfov": 68,
    "pitch": 11,
    "yaw": 0,
    "type": "equirectangular",
    "panorama": "https://smarttravel-vr.mobifone.vn/vr-api/uploads/user/6417e3cfafa35e54a1da0e50/media/pano/preview/4000x_CLzVauvTLnAvcubdWvou.webp",
    "hotSpots": [
      {
        "id": "64b60d6a033a205573dd8d5f",
        "pitch": 9.576,
        "yaw": 88.61,
        "text": "Sân Khánh Tiết",
        "type": "scene",
        "sceneId": "64bb798b3ac0811fa5dbae75",
        "targetYaw": -78.451,
        "targetPitch": 0,
        "targetHfov": 24.089
      },
      {
        "id": "64bb58f23ac0811fa5dbae4a",
        "pitch": 23.457,
        "yaw": 179.288,
        "text": "Sân Chính",
        "type": "scene",
        "sceneId": "64b60aeb033a205573dd8d59",
        "targetYaw": 8.91,
        "targetPitch": 8.276,
        "targetHfov": 80.7
      },
      {
        "id": "6581479fe9120f49f7ddbce3",
        "pitch": 8.101,
        "yaw": -92.129,
        "text": "Khu A",
        "type": "scene",
        "sceneId": "64bb43b23ac0811fa5dbae3f",
        "targetYaw": -81.462,
        "targetPitch": 10.818,
        "targetHfov": 90
      },
      {
        "id": "6583b71ae9120f49f7ddbda8",
        "pitch": -21.124,
        "yaw": -1.924,
        "text": "Tượng Đài",
        "type": "scene",
        "sceneId": "6583b3f4e9120f49f7ddbd98"
      }
    ]
  },
  "64b60aeb033a205573dd8d57": {
    "title": "Cổng Chính",
    "hfov": 65,
    "pitch": 11,
    "yaw": 2,
    "type": "equirectangular",
    "panorama": "https://smarttravel-vr.mobifone.vn/vr-api/uploads/user/6417e3cfafa35e54a1da0e50/media/pano/preview/4000x_T3ojr9e9lW2Ap524sVSB.webp",
    "hotSpots": [
      {
        "id": "64b60b24033a205573dd8d5a",
        "pitch": 24.681,
        "yaw": -1.601,
        "text": "Sân Chính",
        "type": "scene",
        "sceneId": "64b60aeb033a205573dd8d59",
        "targetYaw": 2.788,
        "targetPitch": 15.921,
        "targetHfov": 48.038
      }
    ]
  },
  "64b60aeb033a205573dd8d59": {
    "title": "Sân Chính",
    "hfov": 89,
    "pitch": 39,
    "yaw": 1,
    "type": "equirectangular",
    "panorama": "https://smarttravel-vr.mobifone.vn/vr-api/uploads/user/6417e3cfafa35e54a1da0e50/media/pano/preview/4000x_U29tJYhd27IxJZ7e1Wcz.webp",
    "hotSpots": [
      {
        "id": "64b60ccc033a205573dd8d5b",
        "pitch": 22.285,
        "yaw": -2.46,
        "text": "Sân Nghi Lễ",
        "type": "scene",
        "sceneId": "64b60aeb033a205573dd8d56",
        "targetYaw": -1.195,
        "targetPitch": 1.265,
        "targetHfov": 50.092
      },
      {
        "id": "64b60ce5033a205573dd8d5c",
        "pitch": 16.448,
        "yaw": 37.536,
        "text": "Đền Tưởng Niệm",
        "type": "scene",
        "sceneId": "64b60aeb033a205573dd8d58",
        "targetYaw": -2.558,
        "targetPitch": 22.5,
        "targetHfov": 104.593
      },
      {
        "id": "64bb44273ac0811fa5dbae41",
        "pitch": 74.41,
        "yaw": -14.624,
        "text": "Cổng Chính",
        "type": "scene",
        "sceneId": "64b60aeb033a205573dd8d57",
        "targetYaw": 0.941,
        "targetPitch": 2.146,
        "targetHfov": 72.868
      },
      {
        "id": "64be1079033a205573dd8df3",
        "pitch": 7.879,
        "yaw": 36.433,
        "text": "Thông tin",
        "type": "info"
      },
      {
        "id": "64bf4ecf033a205573dd8df9",
        "pitch": 16.535,
        "yaw": 26.157,
        "text": "Sân Khánh Tiết",
        "type": "scene",
        "sceneId": "64bb798b3ac0811fa5dbae75",
        "targetYaw": -56.328,
        "targetPitch": -4.004,
        "targetHfov": 90
      },
      {
        "id": "64bf4ed6033a205573dd8dfa",
        "pitch": 14.014,
        "yaw": -1.483,
        "text": "Hoa Viên",
        "type": "scene",
        "sceneId": "64bb76a23ac0811fa5dbae6e",
        "targetYaw": 2.272,
        "targetPitch": 49.46,
        "targetHfov": 87.976
      },
      {
        "id": "6583b37de9120f49f7ddbd91",
        "pitch": 14.615,
        "yaw": -24.576,
        "text": "Khu A",
        "type": "scene",
        "sceneId": "64bb43b23ac0811fa5dbae3f",
        "targetYaw": 128.299,
        "targetPitch": 5.729,
        "targetHfov": 90
      },
      {
        "id": "6583b384e9120f49f7ddbd92",
        "pitch": 8.113,
        "yaw": -18.437,
        "text": "Khu B",
        "type": "scene",
        "sceneId": "64b6c9ca3ac0811fa5dbac97",
        "targetYaw": -71.271,
        "targetPitch": 12.093,
        "targetHfov": 90
      },
      {
        "id": "6583b38ee9120f49f7ddbd93",
        "pitch": 7.065,
        "yaw": -10.161,
        "text": "Khu C",
        "type": "scene",
        "sceneId": "64b6cd0f3ac0811fa5dbac9b"
      },
      {
        "id": "6583b395e9120f49f7ddbd94",
        "pitch": 9.41,
        "yaw": 10.1,
        "text": "Khu D",
        "type": "scene",
        "sceneId": "64bb5bc33ac0811fa5dbae4e",
        "targetYaw": 2.286,
        "targetPitch": 24.616,
        "targetHfov": 81.956
      },
      {
        "id": "6583b3aae9120f49f7ddbd95",
        "pitch": 12.931,
        "yaw": 19.05,
        "text": "Khu E",
        "type": "scene",
        "sceneId": "64bb58643ac0811fa5dbae47",
        "targetYaw": 89.853,
        "targetPitch": 20.479,
        "targetHfov": 90
      },
      {
        "id": "6583b461e9120f49f7ddbd9b",
        "pitch": 20.154,
        "yaw": 34.615,
        "text": "Sân Đền",
        "type": "scene",
        "sceneId": "6583b421e9120f49f7ddbd9a",
        "targetYaw": 0.424,
        "targetPitch": 11.621,
        "targetHfov": 74.708
      },
      {
        "id": "6583b4a2e9120f49f7ddbd9c",
        "pitch": 5.353,
        "yaw": 0.306,
        "text": "Tượng Đài",
        "type": "scene",
        "sceneId": "6583b3f4e9120f49f7ddbd98"
      }
    ]
  },
  "64b60aeb033a205573dd8d58": {
    "title": "Đền Tưởng Niệm",
    "hfov": 100,
    "pitch": 26,
    "yaw": -4,
    "type": "equirectangular",
    "panorama": "https://smarttravel-vr.mobifone.vn/vr-api/uploads/user/6417e3cfafa35e54a1da0e50/media/pano/preview/4000x_8LqeHmLHOZsrXeHVEb4T.webp",
    "hotSpots": [
      {
        "id": "64b60e31033a205573dd8d60",
        "pitch": 27.561,
        "yaw": -134.053,
        "text": "Sân Khánh Tiết",
        "type": "scene",
        "sceneId": "64bb798b3ac0811fa5dbae75",
        "targetYaw": 22.734,
        "targetPitch": 18.315,
        "targetHfov": 101.166
      },
      {
        "id": "6583b549e9120f49f7ddbd9e",
        "pitch": 42.763,
        "yaw": 177.36,
        "text": "Sân Đền",
        "type": "scene",
        "sceneId": "6583b421e9120f49f7ddbd9a",
        "targetYaw": 0.508,
        "targetPitch": 13.764,
        "targetHfov": 70.424
      }
    ]
  },
  "64b6c9ca3ac0811fa5dbac97": {
    "title": "Khu B",
    "hfov": 90,
    "pitch": 22,
    "yaw": 179,
    "type": "equirectangular",
    "panorama": "https://smarttravel-vr.mobifone.vn/vr-api/uploads/user/6417e3cfafa35e54a1da0e50/media/pano/preview/4000x_8amJIaugPtkXhiLZXgwV.webp",
    "hotSpots": [
      {
        "id": "64b6cd4d3ac0811fa5dbac9c",
        "pitch": 15.291,
        "yaw": -19.909,
        "text": "Khu C",
        "type": "scene",
        "sceneId": "64b6cd0f3ac0811fa5dbac9b",
        "targetYaw": -77.219,
        "targetPitch": 9.577,
        "targetHfov": 90
      },
      {
        "id": "64bb458d3ac0811fa5dbae45",
        "pitch": 16.043,
        "yaw": 6.752,
        "text": "Khu A",
        "type": "scene",
        "sceneId": "64bb43b23ac0811fa5dbae3f",
        "targetYaw": 39.036,
        "targetPitch": -2.21,
        "targetHfov": 40.211
      },
      {
        "id": "64be0f04033a205573dd8def",
        "pitch": 5.574,
        "yaw": 5.451,
        "text": "Khu B",
        "type": "info"
      },
      {
        "id": "6583b991e9120f49f7ddbdaa",
        "pitch": -19.454,
        "yaw": -8.206,
        "text": "Tượng Đài",
        "type": "scene",
        "sceneId": "6583b3f4e9120f49f7ddbd98",
        "targetYaw": -79.536,
        "targetPitch": 7.925,
        "targetHfov": 101.337
      }
    ]
  },
  "64b6cd0f3ac0811fa5dbac9b": {
    "title": "Khu C",
    "hfov": 115,
    "pitch": 31,
    "yaw": -1,
    "type": "equirectangular",
    "panorama": "https://smarttravel-vr.mobifone.vn/vr-api/uploads/user/6417e3cfafa35e54a1da0e50/media/pano/preview/4000x_0KNu2yQCERgxw0UteWUH.webp",
    "hotSpots": [
      {
        "id": "64b6cd853ac0811fa5dbac9d",
        "pitch": 8.945,
        "yaw": 69.073,
        "text": "Khu B",
        "type": "scene",
        "sceneId": "64b6c9ca3ac0811fa5dbac97",
        "targetYaw": 16.436,
        "targetPitch": -2.502,
        "targetHfov": 38.302
      },
      {
        "id": "64bb5c8e3ac0811fa5dbae52",
        "pitch": 13.038,
        "yaw": -81.64,
        "text": "Khu D",
        "type": "scene",
        "sceneId": "64bb5bc33ac0811fa5dbae4e",
        "targetYaw": -67.152,
        "targetPitch": 12.154,
        "targetHfov": 90
      },
      {
        "id": "64be0fa4033a205573dd8df1",
        "pitch": 1.81,
        "yaw": 15.633,
        "text": "Khu C",
        "type": "info"
      }
    ]
  },
  "64bb43b23ac0811fa5dbae3f": {
    "title": "Khu A",
    "hfov": 60,
    "pitch": 24,
    "yaw": 125,
    "type": "equirectangular",
    "panorama": "https://smarttravel-vr.mobifone.vn/vr-api/uploads/user/6417e3cfafa35e54a1da0e50/media/pano/preview/4000x_Av9N4l6dF7nIdPl9WHg6.webp",
    "hotSpots": [
      {
        "id": "64bb449d3ac0811fa5dbae43",
        "pitch": 8.51,
        "yaw": -75.839,
        "text": "Khu B",
        "type": "scene",
        "sceneId": "64b6c9ca3ac0811fa5dbac97",
        "targetYaw": -56.726,
        "targetPitch": 9.763,
        "targetHfov": 75.528
      },
      {
        "id": "64bb44bc3ac0811fa5dbae44",
        "pitch": 12.544,
        "yaw": 64.089,
        "text": "Sân Nghi Lễ",
        "type": "scene",
        "sceneId": "64b60aeb033a205573dd8d56",
        "targetYaw": -0.876,
        "targetPitch": 1.326,
        "targetHfov": 47.073
      },
      {
        "id": "64be095a033a205573dd8de9",
        "pitch": 8.209,
        "yaw": 15.814,
        "text": "KHU A",
        "type": "info"
      }
    ]
  },
  "64bb58643ac0811fa5dbae47": {
    "title": "Khu E",
    "hfov": 101,
    "pitch": 12,
    "yaw": 101,
    "type": "equirectangular",
    "panorama": "https://smarttravel-vr.mobifone.vn/vr-api/uploads/user/6417e3cfafa35e54a1da0e50/media/pano/preview/4000x_If5Pb8hYfVszktm3ZCfP.webp",
    "hotSpots": [
      {
        "id": "64bb587d3ac0811fa5dbae48",
        "pitch": 12.152,
        "yaw": -172.858,
        "text": "Sân Khánh Tiết",
        "type": "scene",
        "sceneId": "64bb798b3ac0811fa5dbae75",
        "targetYaw": -82.498,
        "targetPitch": 1.245,
        "targetHfov": 42.501
      },
      {
        "id": "64bb58bc3ac0811fa5dbae49",
        "pitch": 16.026,
        "yaw": -72.8,
        "text": "Sân Nghi Lễ",
        "type": "scene",
        "sceneId": "64b60aeb033a205573dd8d56"
      },
      {
        "id": "64bb5cb83ac0811fa5dbae53",
        "pitch": 4.831,
        "yaw": 57.327,
        "text": "Khu D",
        "type": "scene",
        "sceneId": "64bb5bc33ac0811fa5dbae4e",
        "targetYaw": -10.064,
        "targetPitch": 0,
        "targetHfov": 90
      },
      {
        "id": "64be0cd4033a205573dd8deb",
        "pitch": 31.076,
        "yaw": -19.892,
        "text": "KHU E",
        "type": "info"
      },
      {
        "id": "6583b9e0e9120f49f7ddbdac",
        "pitch": -23.574,
        "yaw": 7.805,
        "text": "Tượng Đài",
        "type": "scene",
        "sceneId": "6583b3f4e9120f49f7ddbd98",
        "targetYaw": 109.331,
        "targetPitch": 5.721,
        "targetHfov": 90
      }
    ]
  },
  "64bb5bc33ac0811fa5dbae4e": {
    "title": "Khu D",
    "hfov": 104,
    "pitch": 35,
    "yaw": 3,
    "type": "equirectangular",
    "panorama": "https://smarttravel-vr.mobifone.vn/vr-api/uploads/user/6417e3cfafa35e54a1da0e50/media/pano/preview/4000x_9MntzXTxardP23eosgyh.webp",
    "hotSpots": [
      {
        "id": "64bb5c043ac0811fa5dbae50",
        "pitch": 14.047,
        "yaw": 108.454,
        "text": "Khu C",
        "type": "scene",
        "sceneId": "64b6cd0f3ac0811fa5dbac9b",
        "targetYaw": -17.921,
        "targetPitch": 0,
        "targetHfov": 66.42
      },
      {
        "id": "64bb5c3a3ac0811fa5dbae51",
        "pitch": 12.139,
        "yaw": -103.147,
        "text": "Khu E",
        "type": "scene",
        "sceneId": "64bb58643ac0811fa5dbae47",
        "targetYaw": -14.96,
        "targetPitch": 0,
        "targetHfov": 90
      },
      {
        "id": "64be0e77033a205573dd8ded",
        "pitch": 4.931,
        "yaw": -19.007,
        "text": "Khu D",
        "type": "info"
      },
      {
        "id": "6583b9b5e9120f49f7ddbdab",
        "pitch": 3.601,
        "yaw": 0.859,
        "text": "Tượng Đài",
        "type": "scene",
        "sceneId": "6583b3f4e9120f49f7ddbd98",
        "targetYaw": 52.759,
        "targetPitch": -7.631,
        "targetHfov": 90
      }
    ]
  },
  "64bb76a23ac0811fa5dbae6e": {
    "title": "Hoa Viên",
    "hfov": 84,
    "pitch": 57,
    "yaw": 2,
    "type": "equirectangular",
    "panorama": "https://smarttravel-vr.mobifone.vn/vr-api/uploads/user/6417e3cfafa35e54a1da0e50/media/pano/preview/4000x_lnBduxKItrJvI6Uq1AN9.webp",
    "hotSpots": [
      {
        "id": "6583b572e9120f49f7ddbd9f",
        "pitch": 15.869,
        "yaw": -1.828,
        "text": "Tượng Đài",
        "type": "scene",
        "sceneId": "6583b3f4e9120f49f7ddbd98",
        "targetYaw": 3.955,
        "targetPitch": -12.448,
        "targetHfov": 96.351
      },
      {
        "id": "669dcc0ff50cba06523610da",
        "pitch": 75.783,
        "yaw": -20.477,
        "text": "Sân Nghi Lễ",
        "type": "scene",
        "sceneId": "64b60aeb033a205573dd8d56"
      }
    ]
  },
  "64bb798b3ac0811fa5dbae75": {
    "title": "Sân Khánh Tiết",
    "hfov": 89,
    "pitch": 8,
    "yaw": -142,
    "type": "equirectangular",
    "panorama": "https://smarttravel-vr.mobifone.vn/vr-api/uploads/user/6417e3cfafa35e54a1da0e50/media/pano/preview/4000x_skjeD6h5oPGR6O3J9QpV.webp",
    "hotSpots": [
      {
        "id": "64bb79ab3ac0811fa5dbae76",
        "pitch": 15.41,
        "yaw": -91.016,
        "text": "Sân Đền",
        "type": "scene",
        "sceneId": "6583b421e9120f49f7ddbd9a",
        "targetYaw": 0.557,
        "targetPitch": 14.39,
        "targetHfov": 65.937
      },
      {
        "id": "64bb79da3ac0811fa5dbae77",
        "pitch": 9.993,
        "yaw": 57.939,
        "text": "Sân Nghi Lễ",
        "type": "scene",
        "sceneId": "64b60aeb033a205573dd8d56",
        "targetYaw": -10.238,
        "targetPitch": -10.297,
        "targetHfov": 49.157
      },
      {
        "id": "64bb7a093ac0811fa5dbae78",
        "pitch": 2.71,
        "yaw": -4.302,
        "text": "Cổng Chính",
        "type": "scene",
        "sceneId": "64b60aeb033a205573dd8d57",
        "targetYaw": -1.504,
        "targetPitch": -2.979,
        "targetHfov": 63.919
      },
      {
        "id": "64bb7a413ac0811fa5dbae79",
        "pitch": 16.667,
        "yaw": 176.971,
        "text": "Khu E",
        "type": "scene",
        "sceneId": "64bb58643ac0811fa5dbae47",
        "targetYaw": -22.8,
        "targetPitch": 0,
        "targetHfov": 90
      }
    ]
  },
  "6583b3f4e9120f49f7ddbd98": {
    "title": "Tượng Đài",
    "hfov": 79,
    "pitch": 1,
    "yaw": 4,
    "type": "equirectangular",
    "panorama": "https://smarttravel-vr.mobifone.vn/vr-api/uploads/user/6417e3cfafa35e54a1da0e50/media/pano/preview/4000x_EFVRLgp7CCG3HwLihpdl.webp",
    "hotSpots": [
      {
        "id": "6583b63de9120f49f7ddbda0",
        "pitch": -0.979,
        "yaw": -32.521,
        "text": "Khu C",
        "type": "scene",
        "sceneId": "64b6cd0f3ac0811fa5dbac9b"
      },
      {
        "id": "6583b65ae9120f49f7ddbda1",
        "pitch": 9.62,
        "yaw": -112.754,
        "text": "Khu A",
        "type": "scene",
        "sceneId": "64bb43b23ac0811fa5dbae3f",
        "targetYaw": 128.954,
        "targetPitch": 26.08,
        "targetHfov": 85.269
      },
      {
        "id": "6583b66ae9120f49f7ddbda2",
        "pitch": 7.23,
        "yaw": -76.034,
        "text": "Khu B",
        "type": "scene",
        "sceneId": "64b6c9ca3ac0811fa5dbac97",
        "targetYaw": -84.953,
        "targetPitch": 10.085,
        "targetHfov": 79.831
      },
      {
        "id": "6583b686e9120f49f7ddbda3",
        "pitch": 1.948,
        "yaw": 26.85,
        "text": "Khu D",
        "type": "scene",
        "sceneId": "64bb5bc33ac0811fa5dbae4e",
        "targetYaw": 1.643,
        "targetPitch": 10.412,
        "targetHfov": 84.915
      },
      {
        "id": "6583b69ce9120f49f7ddbda4",
        "pitch": 8.492,
        "yaw": 74.943,
        "text": "Khu E",
        "type": "scene",
        "sceneId": "64bb58643ac0811fa5dbae47",
        "targetYaw": 97.809,
        "targetPitch": 22.254,
        "targetHfov": 90
      },
      {
        "id": "6583b6aee9120f49f7ddbda5",
        "pitch": 10.005,
        "yaw": -178.9,
        "text": "Sân Nghi Lễ",
        "type": "scene",
        "sceneId": "64b60aeb033a205573dd8d56"
      },
      {
        "id": "6583b6b8e9120f49f7ddbda6",
        "pitch": 7.239,
        "yaw": 118.2,
        "text": "Sân Khánh Tiết",
        "type": "scene",
        "sceneId": "64bb798b3ac0811fa5dbae75",
        "targetYaw": -138.393,
        "targetPitch": 3,
        "targetHfov": 96.348
      },
      {
        "id": "6583b6d9e9120f49f7ddbda7",
        "pitch": 2.992,
        "yaw": 127.714,
        "text": "Đền Tưởng Niệm",
        "type": "scene",
        "sceneId": "64b60aeb033a205573dd8d58",
        "targetYaw": -3.553,
        "targetPitch": 19.477,
        "targetHfov": 112.924
      }
    ]
  },
  "6583b421e9120f49f7ddbd9a": {
    "title": "Sân Đền",
    "hfov": 66,
    "pitch": 21,
    "yaw": 1,
    "type": "equirectangular",
    "panorama": "https://smarttravel-vr.mobifone.vn/vr-api/uploads/user/6417e3cfafa35e54a1da0e50/media/pano/preview/4000x_xvswCBMLraQ9MxROa3v0.webp",
    "hotSpots": [
      {
        "id": "6583b515e9120f49f7ddbd9d",
        "pitch": 21.126,
        "yaw": -0.292,
        "text": "Đền Tưởng Niệm",
        "type": "scene",
        "sceneId": "64b60aeb033a205573dd8d58",
        "targetYaw": -3.193,
        "targetPitch": 22.501,
        "targetHfov": 97.877
      }
    ]
  }
});

export const pannellumSetup = derived([initialConfig, scenes], ([$initialConfig, $scenes]) => ({
	...$initialConfig,
	scenes: $scenes
}));

// Derived store to list the hotSpots in the selected scene
export const hotSpotsInSelectedScene = derived(
	[selectedScene, scenes],
	([$selectedScene, $scenes]) => {
		const scene = $scenes[$selectedScene];
		return scene ? scene.hotSpots : [];
	}
);

export const hotSpotTypes: { [key: string]: string } = {
	scene: 'Scene',
	info: 'Info',
	// custom: 'Custom'
};
