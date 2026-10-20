export const DEMO_SRT = '1\r\n00:00:01,000 --> 00:00:03,200\r\nA small tool, built for careful work.\r\n\r\n2\r\n00:00:03,500 --> 00:00:06,000\r\n<i>Translate the words.</i>\r\nKeep the timing.\r\n\r\n3\r\n00:00:06,400 --> 00:00:09,100\r\nEvery cue keeps its own ID.\r\n\r\n4\r\n00:00:09,500 --> 00:00:12,000\r\nReview the subtitles before sharing.\r\n';
export const DEMO_VTT = 'WEBVTT\n\nNOTE Fictional example, created for CueBridge.\n\nSTYLE\n::cue { color: white; }\n\nintro\n00:01.000 --> 00:03.200 align:start\nA small tool, built for careful work.\n\nwords\n00:03.500 --> 00:06.000\n<i>Translate the words.</i>\nKeep the timing.\n\nidentity\n00:06.400 --> 00:09.100\nEvery cue keeps its own ID.\n\nreview\n00:09.500 --> 00:12.000\nReview the subtitles before sharing.\n';
export const DEMO_TRANSLATIONS = Object.freeze([
  '一个小工具，为细致的工作而造。',
  '<i>翻译文字。</i>\n保留时间轴。',
  '每条字幕都有自己的 ID。',
  '分享之前，请审阅字幕。'
]);
