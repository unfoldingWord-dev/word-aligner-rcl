Word Aligner Example:

```js
import {
  addAlignmentsToVerseUSFM,
  areAlgnmentsComplete,
  parseUsfmToWordAlignerData
} from "../utils/alignmentHelpers";
import {convertVerseDataToUSFM} from "../utils/UsfmFileConversionHelpers";
import {NT_ORIG_LANG} from "../common/constants";

// var alignedVerseJson = require('../__tests__/fixtures/alignments/en_ult_tit_1_1.json');
var alignedVerseJson = require('../__tests__/fixtures/alignments/en_ult_tit_1_1_partial.json');
var originalVerseJson = require('../__tests__/fixtures/alignments/grk_tit_1_1.json');
const LexiconData = require("../__tests__/fixtures/lexicon/lexicons.json");

const translate = (key) => {
  console.log(`translate(${key})`)
};

const targetVerseUSFM = alignedVerseJson.usfm;
const sourceVerseUSFM = originalVerseJson.usfm;

const {targetWords, verseAlignments} = parseUsfmToWordAlignerData(targetVerseUSFM, sourceVerseUSFM);

const alignmentComplete = areAlgnmentsComplete(targetWords, verseAlignments);
console.log(`Alignments are ${alignmentComplete ? 'COMPLETE!' : 'incomplete'}`);

const App = () => {
  const targetLanguageFont = '';
  const sourceLanguage = NT_ORIG_LANG;
  const lexicons = {};
  const contextId = {
    "reference": {
      "bookId": "tit",
      "chapter": 1,
      "verse": 1
    },
    "tool": "wordAlignment",
    "groupId": "chapter_1"
  };
  const showPopover = (PopoverTitle, wordDetails, positionCoord, rawData) => {
    console.log(`showPopover()`, rawData)
    window.prompt(`User clicked on ${JSON.stringify(rawData.token)}`)
  };
  const loadLexiconEntry = (key) => {
    console.log(`loadLexiconEntry(${key})`)
  };
  const getLexiconData_ = (lexiconId, entryId) => {
    console.log(`loadLexiconEntry(${lexiconId}, ${entryId})`)
    const entryData = (LexiconData && LexiconData[lexiconId]) ? LexiconData[lexiconId][entryId] : null;
    return {[lexiconId]: {[entryId]: entryData}};
  };

  function onChange(results) {
    console.log(`WordAligner() - alignment changed, results`, results);// merge alignments into target verse and convert to USFM
    const {targetWords, verseAlignments} = results;
    const verseUsfm = addAlignmentsToVerseUSFM(targetWords, verseAlignments, targetVerseUSFM);
    console.log(verseUsfm);
    const alignmentComplete = areAlgnmentsComplete(targetWords, verseAlignments);
    console.log(`Alignments are ${alignmentComplete ? 'COMPLETE!' : 'incomplete'}`);
  }

  return (
    <div style={{height: '650px', width: '800px'}}>
      <WordAligner
        verseAlignments={verseAlignments}
        targetWords={targetWords}
        translate={translate}
        contextId={contextId}
        targetLanguageFont={targetLanguageFont}
        sourceLanguage={sourceLanguage}
        showPopover={showPopover}
        lexicons={lexicons}
        loadLexiconEntry={loadLexiconEntry}
        onChange={onChange}
        getLexiconData={getLexiconData_}
      />
    </div>
  );
};

App();
```
