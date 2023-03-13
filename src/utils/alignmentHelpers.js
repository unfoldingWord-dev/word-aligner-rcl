import _ from "lodash";
import {removeUsfmMarkers, usfmVerseToJson} from "./usfmHelpers";
import wordaligner from "word-aligner";
import * as UsfmFileConversionHelpers from "./UsfmFileConversionHelpers";
import {
  convertAlignmentFromVerseToVerseSpanSub,
  convertVerseDataToUSFM,
  getUsfmForVerseContent
} from "./UsfmFileConversionHelpers";
import {
  getAlignedWordListFromAlignments,
  getOriginalLanguageListForVerseData,
  updateAlignedWordsFromOriginalWordList
} from "./migrateOriginalLanguageHelpers";
import Lexer from "wordmap-lexer";
import * as verseHelpers from "tc-ui-toolkit/lib/ScripturePane/helpers/verseHelpers";

/**
 * get all the alignments for verse from nested array (finds zaln objects)
 * @param {array} verseSpanAlignments
 * @return {*[]}
 */
export function getVerseAlignments(verseSpanAlignments) {
  let alignments = [];

  if (verseSpanAlignments) {
    for (let alignment of verseSpanAlignments) {
      if (alignment.tag === 'zaln') {
        alignments.push(alignment);
      }

      if (alignment.children) {
        const subAlignments = getVerseAlignments(alignment.children);

        if (subAlignments.length) {
          alignments = alignments.concat(subAlignments);
        }
      }
    }
  }
  return alignments;
}

/**
 * search through verseAlignments for word and get occurrences
 * @param {object} verseAlignments
 * @param {string|number} matchVerse
 * @param {string} word
 * @return {number}
 */
export function getWordCountInVerse(verseAlignments, matchVerse, word) {
  let matchedAlignment = null;

  for (let alignment of verseAlignments[matchVerse]) {
    for (let topWord of alignment.topWords) {
      if (topWord.word === word) {
        matchedAlignment = topWord;
        break;
      }
    }

    if (matchedAlignment) {
      break;
    }
  }

  const wordCount = matchedAlignment && matchedAlignment.occurrences;
  return wordCount || 0;
}

/**
 * convert to number if string
 * @param {string|number} value
 * @returns {number|*}
 */
function parseStrToNumber(value) {
  if (typeof value === 'string') {
    const number = parseInt(value);
    return number;
  }
  return value;
}

/**
 * for each item in word list convert occurrence(s) to numbers
 * @param {array} wordlist
 * @returns {array}
 */
function convertOccurrences(wordlist) {
  const wordlist_ = wordlist.map(item => {
    const occurrence = parseStrToNumber(item.occurrence);
    const occurrences = parseStrToNumber(item.occurrences);
    return {
      ...item,
      occurrence,
      occurrences,
    }
  })
  return wordlist_;
}

/**
 * get the word list from alignments
 * @param {array} verseObjects
 * @return {array}
 */
export function getWordListFromVerseObjects(verseObjects) {
  const targetVerseUSFM = getUsfmForVerseContent({verseObjects})
  const targetTokens = Lexer.tokenize(removeUsfmMarkers(targetVerseUSFM));
  return targetTokens;
}

/**
 * extract alignments from target verse USFM using sourceVerse for word ordering
 * @param {string} alignedTargetVerse
 * @param {object|null} sourceVerse - optional source verse in verseObject format to maintain source language word order
 * @return {array} list of alignments in target text
 */
export function extractAlignmentsFromTargetVerse(alignedTargetVerse, sourceVerse) {
  const targetVerse = usfmVerseToJson(alignedTargetVerse);
  const alignments = wordaligner.unmerge(targetVerse, sourceVerse);
  const originalLangWordList = sourceVerse && getOriginalLanguageListForVerseData(sourceVerse);
  const alignmentsWordList = getAlignedWordListFromAlignments(alignments.alignment);
  const targetTokens = getWordListFromVerseObjects(targetVerse);
  // clean up metadata in alignments
  originalLangWordList && updateAlignedWordsFromOriginalWordList(originalLangWordList, alignmentsWordList);
  if (alignments.alignment) { // for compatibility change alignment to alignments
    // convert occurrence(s) from string to number
    const alignments_ = alignments.alignment.map(alignment => {
      const topWords = convertOccurrences(alignment.topWords);
      const bottomWords = convertOccurrences(alignment.bottomWords);
      return {
        sourceNgram: topWords.map(topWord => { // word aligner uses sourceNgram instead of topWord
          if (originalLangWordList) {
            const pos = originalLangWordList.findIndex(item => (
              topWord.word === (item.word || item.text) &&
              topWord.occurrence === item.occurrence
            ));
            const newSource = {
              ...topWord,
              index: pos,
              text: topWord.text || topWord.word,
            };
            delete newSource.word
            return newSource
          }
          const newSource = {
            ...topWord,
            text: topWord.text || topWord.word,
          };
          delete newSource.word
          delete newSource.position
          return newSource
        }),
        targetNgram: bottomWords.map(bottomWord => { // word aligner uses targetNgram instead of bottomWords
          const word = bottomWord.text || bottomWord.word
          // noinspection EqualityComparisonWithCoercionJS
          const pos = targetTokens.findIndex(item => (
            word === item.text &&
            // eslint-disable-next-line eqeqeq
            bottomWord.occurrence == item.occurrence
          ));

          const newTarget = {
            ...bottomWord,
            index: pos,
            text: word,
          };
          delete newTarget.word
          return newTarget;
        }),
      }
    })
    alignments.alignments = alignments_;
  }
  return alignments;
}

/**
 * merge alignments into target verse
 * @param {string} targetVerseText - target verse to receive alignments
 * @param {{alignments, wordBank}} verseAlignments - contains all the alignments and wordbank is list of unaligned target words
 * @return {string|null} target verse in USFM format
 */
export function addAlignmentsToTargetVerseUsingMerge(targetVerseText, verseAlignments) {
  const verseString = UsfmFileConversionHelpers.cleanAlignmentMarkersFromString(targetVerseText);
  let verseObjects;

  try {
    verseObjects = wordaligner.merge(
      verseAlignments.alignments, verseAlignments.wordBank, verseString, true,
    );
  } catch (e) {
    console.log(`addAlignmentsToTargetVerseUsingMerge() - invalid alignment`, e);
  }

  if (verseObjects) {
    const targetVerse = convertVerseDataToUSFM({verseObjects});
    return targetVerse;
  }

  return null;
}

/**
 * iterate through the target words marking words as disabled if they are already used in alignments
 * @param {array} targetWordList
 * @param {array} alignments
 * @returns {array} updated target word list
 */
export function  markTargetWordsAsDisabledIfAlreadyUsedForAlignments(targetWordList, alignments) {
  return targetWordList.map(token => {
    let isUsed = false;

    for (const alignment of alignments) {
      for (const usedToken of alignment.targetNgram) {
        if (token.text.toString() === usedToken.text.toString()
          && token.occurrence === usedToken.occurrence
          && token.occurrences === usedToken.occurrences) {
          isUsed = true;
          break;
        }
      }
      if (isUsed) {
        break;
      }
    }

    const targetWord = { // exclude unneeded data
      disabled: isUsed,
      text: token.text,
      occurrence: token.tokenOccurrence,
      occurrences: token.tokenOccurrences,
      index: token.tokenPos,
    }
    return targetWord;
  });
}

/**
 * create wordbank of unused target words, transform alignments, and then merge alignments into target verse
 * @param {array} wordBankWords - list of all target words in word bank - the disabled flag indicates word is aligned
 * @param {array} verseAlignments
 * @param {string} targetVerseText - target verse to receive alignments
 * @return {string|null} target verse in USFM format
 */
export function addAlignmentsToVerseUSFM(wordBankWords, verseAlignments, targetVerseText) {
  let wordBank = wordBankWords.filter(item => (!item.disabled))
  wordBank = wordBank.map(item => ({
    ...item,
    word: item.word || item.text,
    occurrence: item.occurrence || item.occurrence,
    occurrences: item.occurrences || item.occurrences,
  }))
  // remap sourceNgram:topWords, targetNgram:bottomWords,
  const alignments_ = verseAlignments.map(item => ({
    ...item,
    topWords: item.sourceNgram.map(item => ({
      strong: item.strong,
      lemma: item.lemma,
      morph: item.morph,
      occurrence: item.occurrence,
      occurrences: item.occurrences,
      word: item.word || item.text,
    })),
    bottomWords: item.targetNgram.map(item => ({
      ...item,
      word: item.word || item.text
    })),
  }));
  const alignments = {
    alignments: alignments_,
    wordBank,
  }
  const verseUsfm = addAlignmentsToTargetVerseUsingMerge(targetVerseText, alignments);
  return verseUsfm;
}

/**
 * parse target language and original language USFM text into the structures needed by the word-aligner
 * @param {string} targetVerseUSFM
 * @param {string|null} sourceVerseUSFM
 * @returns {{targetWords: *[], verseAlignments: *}}
 */
export function parseUsfmToWordAlignerData(targetVerseUSFM, sourceVerseUSFM) {
  let targetTokens = [];
  if (targetVerseUSFM) {
    targetTokens = Lexer.tokenize(removeUsfmMarkers(targetVerseUSFM));
  }

  const sourceVerseObjects = sourceVerseUSFM && usfmVerseToJson(sourceVerseUSFM);
  let targetWords = [];
  const targetVerseAlignments = extractAlignmentsFromTargetVerse(targetVerseUSFM, sourceVerseObjects);
  const verseAlignments = targetVerseAlignments.alignments;
  targetWords = markTargetWordsAsDisabledIfAlreadyUsedForAlignments(targetTokens, verseAlignments);
  return {targetWords, verseAlignments};
}

/**
 * iterate through target word list to make sure all words are used, and then iterate through all alignments to make sure all source alignments have target words
 * @param {array} targetWords
 * @param {array} verseAlignments
 * @returns {boolean}
 */
export function areAlgnmentsComplete(targetWords, verseAlignments) {
  let alignmentComplete = true;
  for (const word of targetWords) {
    if (!word.disabled) {
      alignmentComplete = false;
      break;
    }
  }

  if (alignmentComplete) {
    for (const alignment of verseAlignments) {
      const targetWordCount = alignment.targetNgram?.length || 0;
      if (!targetWordCount) {
        alignmentComplete = false;
        break;
      }
    }
  }
  return alignmentComplete;
}

/**
 * iterates through target words looking for words not in wordBankList.  If an added word is found, it is added to
 *   wordbank.  And if there are other instances are found, then occurrence counts are updated.
 * @param {array} targetWordList - list of target words
 * @param {array} wordBankList - list of target words in the word bank
 * @param {array} verseAlignments - list of verse alignments that may need updating
 */
function handleAddedWordsInNewText(targetWordList, wordBankList, verseAlignments) {
  for (const targetToken of targetWordList) {
    const pos = wordBankList.findIndex(word => (
      word.text === targetToken.text &&
      word.occurrence === targetToken.occurrence
    ))
    if (pos < 0) {
      const occurrences = targetToken.occurrences;
      const tokenWord = targetToken.text;
      // update occurrence count for all aligned instances of this word
      for (const alignment of verseAlignments) {
        for (const targetWord of alignment.targetNgram) {
          if (targetWord.word === tokenWord) {
            targetWord.occurrences = occurrences
          }
        }
      }
      wordBankList.push(targetToken);
    }
  }
}

/**
 * iterates through verse alignments looking for target words not in target word list.  If an extra word is found, it
 * is removed from the verse alignments and occurrence(s) are updated.
 * @param {array} verseAlignments - list of verse alignments that may need updating
 * @param {array} targetWordList - list of target words
 */
function handleDeletedWords(verseAlignments, targetWordList) {
  for (const alignment of verseAlignments) {
    let delete_ = [];
    for (let i = 0, l = alignment.targetNgram.length; i < l; i++) {
      let wordFound = false;
      const targetWord = alignment.targetNgram[i];
      const word = targetWord.text;
      for (const targetToken of targetWordList) {
        if (targetToken.text === word) {
          if (targetWord.occurrence > targetToken.occurrences) {
            delete_.push(i); // extra aligned word
          } else if (targetWord.occurrences !== targetToken.occurrences) {
            // fixup counts
            targetWord.occurrences = targetToken.occurrences;
          }
          wordFound = true;
          break;
        }
      }
      if (!wordFound) {
        delete_.push(i); // extra aligned word
      }
    }
    while (delete_.length) {
      const remove = delete_.pop();
      alignment.targetNgram.splice(remove, 1);
    }
  }
}

/**
 * merge alignments into target verse
 * @return {string|null} target verse in USFM format
 * @param {array} targetVerseObjects
 * @param {string} newTargetVerse
 */
export function updateAlignmentsToTargetVerse(targetVerseObjects, newTargetVerse) {
  let targetVerseText = convertVerseDataToUSFM(targetVerseObjects);
  let { targetWords, verseAlignments } = parseUsfmToWordAlignerData(targetVerseText, null);
  const targetTokens = getWordListFromVerseObjects(usfmVerseToJson(newTargetVerse));
  handleAddedWordsInNewText(targetTokens, targetWords, verseAlignments);
  handleDeletedWords(verseAlignments, targetTokens);
  targetVerseText = addAlignmentsToVerseUSFM(targetWords, verseAlignments, newTargetVerse);
  if (targetVerseText === null) {
    console.log(`updateAlignmentsToTargetVerse() - alignment FAILED for ${newTargetVerse}, removing all alignments`);
    targetVerseText = newTargetVerse;
  }
  const alignedVerseObjects = usfmVerseToJson(targetVerseText)
  return {
    targetVerseObjects: alignedVerseObjects,
    targetVerseText,
  };
}

/**
 * generate blank alignments for all the verses in a verse span
 * @param {string} verseSpan
 * @param {object} origLangChapterJson
 * @param {object} blankVerseAlignments - object to return verse alignments
 * @return {{low, hi}} get range of verses in verse span
 */
function getRawAlignmentsForVerseSpan(verseSpan, origLangChapterJson, blankVerseAlignments) {
  const { low, high } = verseHelpers.getVerseSpanRange(verseSpan);

  // generate raw alignment data for each verse in range
  for (let verse = low; verse <= high; verse++) {
    const originalVerse = origLangChapterJson[verse];

    if (originalVerse) {
      const blankAlignments = wordaligner.generateBlankAlignments(originalVerse);
      blankVerseAlignments[verse] = blankAlignments;
    }
  }

  return { low, hi: high };
}

/**
 * business logic for convertAlignmentsFromVerseSpansToVerse:
 *    for each alignment converts mapping to original language verse span to be mapped to original language verse by adding ref and updating occurrence(s)
 * @param {object} verseSpanData - aligned output data - will be modified with verse span fixes
 * @param {number} low - low verse number of span
 * @param {number} hi - high verse number of span
 * @param {object} blankVerseAlignments - raw verse alignments for extracting word counts for each verse
 * @param {number|string} chapterNumber
 */
function convertAlignmentsFromVerseSpansToVerseSub(verseSpanData, low, hi, blankVerseAlignments, chapterNumber) {
  const verseSpanAlignments = verseSpanData && verseSpanData.verseObjects;
  const alignments = getVerseAlignments(verseSpanAlignments);

  for (let alignment of alignments) {
    const word = alignment.content;
    let occurrence = alignment.occurrence;

    // transform occurrence(s) from verse span based to verse reference
    for (let verse = low; verse <= hi; verse++) {
      const wordCount = getWordCountInVerse(blankVerseAlignments, verse, word);

      if (occurrence <= wordCount) { // if inside this verse, add reference
        alignment.ref = `${chapterNumber}:${verse}`;
        alignment.occurrences = wordCount;
        alignment.occurrence = occurrence;
        break;
      } else {
        occurrence -= wordCount; // subtract counts for this verse
      }
    }
  }
}

/**
 * for each alignment converts mapping to original verse by ref to be mapped to original language verse span by removing ref and updating occurrence(s)
 * @param {object} targetLanguageVerse - in verseObjects format
 * @param {object} originalLanguageChapterData - verseObjects for the current chapter
 * @param {string} chapter - current chapter (used for sanity checking refs for original language alignments)
 * @param {string} verseSpan - range of verses (e.g. '11-13')
 * @return {{alignedTargetVerseObjects: *, originalLanguageVerseObjects: {verseObjects}}}
 */
export function convertAlignmentFromVerseToVerseSpan(targetLanguageVerse, originalLanguageChapterData, chapter, verseSpan) {
  const blankVerseAlignments = {};
  const alignedTargetVerseObjects = _.cloneDeep(targetLanguageVerse)
  const {low, hi} = getRawAlignmentsForVerseSpan(verseSpan, originalLanguageChapterData, blankVerseAlignments);
  let mergedUgntData = [];
  for (let verse = low; verse <= hi; verse++) {
    const verseObjectsForVerse = originalLanguageChapterData?.[verse]?.verseObjects;
    mergedUgntData = mergedUgntData.concat(verseObjectsForVerse || [])
  }
  const originalLanguageVerseObjects = convertAlignmentFromVerseToVerseSpanSub(mergedUgntData, alignedTargetVerseObjects, chapter, low, hi, blankVerseAlignments)
  return {alignedTargetVerseObjects, originalLanguageVerseObjects};
}

/**
 *  for each alignment converts mapping to original language verse span to be mapped to original language verse by adding ref and updating occurrence(s)
 * @param originalLanguageChapterData
 * @param alignedTargetVerseObjects
 * @param {string} chapter
 * @param {string} verseSpan
 * @return {string}
 */
export function convertAlignmentsFromVerseSpansToVerse(originalLanguageChapterData, alignedTargetVerseObjects, chapter, verseSpan) {
  const blankVerseAlignments = {};
  const {low, hi} = getRawAlignmentsForVerseSpan(verseSpan, originalLanguageChapterData, blankVerseAlignments);
  const verseSpanData = _.cloneDeep(alignedTargetVerseObjects)
  convertAlignmentsFromVerseSpansToVerseSub(verseSpanData, low, hi, blankVerseAlignments, chapter)
  const finalUSFM = convertVerseDataToUSFM(verseSpanData)
  return finalUSFM;
}
