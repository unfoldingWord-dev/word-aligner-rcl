/* eslint-env jest */
import _ from 'lodash';
// import {describe, expect, test} from '@jest/globals'

import {updateAlignmentsToTargetVerse} from "../utils/alignmentHelpers";
import {usfmVerseToJson} from "../utils/usfmHelpers";

const initialText = 'I am writing to you, Titus; you have become like a real son to me because we both now believe in Jesus the Messiah. May God the Father and the Messiah Jesus who saves us continue to be kind to you and to give you a peaceful spirit.\n\\p\n';
const alignedInitialVerseText = '\\zaln-s |x-strong="G51030" x-lemma="Τίτος" x-morph="Gr,N,,,,,DMS," x-occurrence="1" x-occurrences="1" x-content="Τίτῳ"\\*\\w I|x-occurrence="1" x-occurrences="1"\\w* \\w am|x-occurrence="1" x-occurrences="1"\\w* \\w writing|x-occurrence="1" x-occurrences="1"\\w* \\w to|x-occurrence="1" x-occurrences="5"\\w* \\w you|x-occurrence="1" x-occurrences="4"\\w*, \\w Titus|x-occurrence="1" x-occurrences="1"\\w*\\zaln-e\\*; \\zaln-s |x-strong="G11030" x-lemma="γνήσιος" x-morph="Gr,AA,,,,DNS," x-occurrence="1" x-occurrences="1" x-content="γνησίῳ"\\*\\w you|x-occurrence="2" x-occurrences="4"\\w* \\w have|x-occurrence="1" x-occurrences="1"\\w* \\w become|x-occurrence="1" x-occurrences="1"\\w* \\w like|x-occurrence="1" x-occurrences="1"\\w* \\w a|x-occurrence="1" x-occurrences="2"\\w* \\w real|x-occurrence="1" x-occurrences="1"\\w*\\zaln-e\\* \\zaln-s |x-strong="G50430" x-lemma="τέκνον" x-morph="Gr,N,,,,,DNS," x-occurrence="1" x-occurrences="1" x-content="τέκνῳ"\\*\\w son|x-occurrence="1" x-occurrences="1"\\w* \\w to|x-occurrence="2" x-occurrences="5"\\w* \\w me|x-occurrence="1" x-occurrences="1"\\w*\\zaln-e\\* \\zaln-s |x-strong="G25960" x-lemma="κατά" x-morph="Gr,P,,,,,A,,," x-occurrence="1" x-occurrences="1" x-content="κατὰ"\\*\\w because|x-occurrence="1" x-occurrences="1"\\w*\\zaln-e\\* \\zaln-s |x-strong="G28390" x-lemma="κοινός" x-morph="Gr,AA,,,,AFS," x-occurrence="1" x-occurrences="1" x-content="κοινὴν"\\*\\w we|x-occurrence="1" x-occurrences="1"\\w* \\w both|x-occurrence="1" x-occurrences="1"\\w* \\w now|x-occurrence="1" x-occurrences="1"\\w*\\zaln-e\\* \\zaln-s |x-strong="G41020" x-lemma="πίστις" x-morph="Gr,N,,,,,AFS," x-occurrence="1" x-occurrences="1" x-content="πίστιν"\\*\\w believe|x-occurrence="1" x-occurrences="1"\\w* \\w in|x-occurrence="1" x-occurrences="1"\\w* \\w Jesus|x-occurrence="1" x-occurrences="2"\\w* \\w the|x-occurrence="1" x-occurrences="3"\\w* \\w Messiah|x-occurrence="1" x-occurrences="2"\\w*\\zaln-e\\*. \\zaln-s |x-strong="G05750" x-lemma="ἀπό" x-morph="Gr,P,,,,,G,,," x-occurrence="1" x-occurrences="1" x-content="ἀπὸ"\\*\\zaln-s |x-strong="G23160" x-lemma="θεός" x-morph="Gr,N,,,,,GMS," x-occurrence="1" x-occurrences="1" x-content="Θεοῦ"\\*\\w May|x-occurrence="1" x-occurrences="1"\\w* \\w God|x-occurrence="1" x-occurrences="1"\\w*\\zaln-e\\*\\zaln-e\\* \\zaln-s |x-strong="G39620" x-lemma="πατήρ" x-morph="Gr,N,,,,,GMS," x-occurrence="1" x-occurrences="1" x-content="Πατρὸς"\\*\\w the|x-occurrence="2" x-occurrences="3"\\w* \\w Father|x-occurrence="1" x-occurrences="1"\\w*\\zaln-e\\* \\zaln-s |x-strong="G25320" x-lemma="καί" x-morph="Gr,CC,,,,,,,," x-occurrence="1" x-occurrences="2" x-content="καὶ"\\*\\w and|x-occurrence="1" x-occurrences="2"\\w*\\zaln-e\\* \\zaln-s |x-strong="G55470" x-lemma="χριστός" x-morph="Gr,N,,,,,GMS," x-occurrence="1" x-occurrences="1" x-content="Χριστοῦ"\\*\\w the|x-occurrence="3" x-occurrences="3"\\w* \\w Messiah|x-occurrence="2" x-occurrences="2"\\w*\\zaln-e\\* \\zaln-s |x-strong="G24240" x-lemma="Ἰησοῦς" x-morph="Gr,N,,,,,GMS," x-occurrence="1" x-occurrences="1" x-content="Ἰησοῦ"\\*\\w Jesus|x-occurrence="2" x-occurrences="2"\\w*\\zaln-e\\* \\zaln-s |x-strong="G35880" x-lemma="ὁ" x-morph="Gr,EA,,,,GMS," x-occurrence="1" x-occurrences="1" x-content="τοῦ"\\*\\w who|x-occurrence="1" x-occurrences="1"\\w*\\zaln-e\\* \\zaln-s |x-strong="G49900" x-lemma="σωτήρ" x-morph="Gr,N,,,,,GMS," x-occurrence="1" x-occurrences="1" x-content="Σωτῆρος"\\*\\w saves|x-occurrence="1" x-occurrences="1"\\w*\\zaln-e\\* \\zaln-s |x-strong="G14730" x-lemma="ἐγώ" x-morph="Gr,RP,,,1G,P," x-occurrence="1" x-occurrences="1" x-content="ἡμῶν"\\*\\w us|x-occurrence="1" x-occurrences="1"\\w*\\zaln-e\\* \\zaln-s |x-strong="G54850" x-lemma="χάρις" x-morph="Gr,N,,,,,NFS," x-occurrence="1" x-occurrences="1" x-content="χάρις"\\*\\w continue|x-occurrence="1" x-occurrences="1"\\w* \\w to|x-occurrence="3" x-occurrences="5"\\w* \\w be|x-occurrence="1" x-occurrences="1"\\w* \\w kind|x-occurrence="1" x-occurrences="1"\\w* \\w to|x-occurrence="4" x-occurrences="5"\\w* \\w you|x-occurrence="3" x-occurrences="4"\\w*\\zaln-e\\* \\zaln-s |x-strong="G25320" x-lemma="καί" x-morph="Gr,CC,,,,,,,," x-occurrence="2" x-occurrences="2" x-content="καὶ"\\*\\w and|x-occurrence="2" x-occurrences="2"\\w*\\zaln-e\\* \\zaln-s |x-strong="G15150" x-lemma="εἰρήνη" x-morph="Gr,N,,,,,NFS," x-occurrence="1" x-occurrences="1" x-content="εἰρήνη"\\*\\w to|x-occurrence="5" x-occurrences="5"\\w* \\w give|x-occurrence="1" x-occurrences="1"\\w* \\w you|x-occurrence="4" x-occurrences="4"\\w* \\w a|x-occurrence="2" x-occurrences="2"\\w* \\w peaceful|x-occurrence="1" x-occurrences="1"\\w* \\w spirit|x-occurrence="1" x-occurrences="1"\\w*\\zaln-e\\*.\n' +
  '\\p\n';
const initialVerseObjects_ = usfmVerseToJson(alignedInitialVerseText);

describe('testing alignment updates', () => {
  test('should pass alignment unchanged', () => {
    const initialVerseObjects = _.cloneDeep(initialVerseObjects_);
    const newText = initialText;
    const results = updateAlignmentsToTargetVerse(initialVerseObjects, newText)
    expect(results.targetVerseText).toEqual(alignedInitialVerseText)
  });

  test('should pass alignment with "zzz" added', () => {
    const initialVerseObjects = _.cloneDeep(initialVerseObjects_);
    const newText = initialText + ' zzz';
    const results = updateAlignmentsToTargetVerse(initialVerseObjects, newText)
    const expectedFinalAlign = alignedInitialVerseText + ' \\w zzz|x-occurrence="1" x-occurrences="1"\\w*';
    expect(results.targetVerseText).toEqual(expectedFinalAlign)
  });

  test('should pass alignment with "to" added', () => {
    const initialVerseObjects = _.cloneDeep(initialVerseObjects_);
    const newText = initialText + ' to';
    const results = updateAlignmentsToTargetVerse(initialVerseObjects, newText)
    expect(results.targetVerseText).toMatchSnapshot()
  });

  test('should pass alignment with "to" deleted', () => {
    const initialVerseObjects = _.cloneDeep(initialVerseObjects_);
    const newText = 'I am writing to you, Titus; you have become like a real son me because we both now believe in Jesus the Messiah. May God the Father and the Messiah Jesus who saves us continue to be kind to you and to give you a peaceful spirit.\n\\p\n';
    const results = updateAlignmentsToTargetVerse(initialVerseObjects, newText)
    const expectedFinalAlign = alignedInitialVerseText;
    expect(results.targetVerseText).toMatchSnapshot()
  });

  test('should pass alignment with "to" moved', () => {
    const initialVerseObjects = _.cloneDeep(initialVerseObjects_);
    const newText = 'I am writing to you, Titus; you have become like a real son me because we both now believe in Jesus the Messiah. May God the Father and the Messiah Jesus who saves us continue to be kind to you and to give you a peaceful spirit.\n\\p\n to';
    const results = updateAlignmentsToTargetVerse(initialVerseObjects, newText)
    const expectedFinalAlign = alignedInitialVerseText;
    expect(results.targetVerseText).toMatchSnapshot()
  });

  test('should pass alignment with "to" renamed to "too"', () => {
    const initialVerseObjects = _.cloneDeep(initialVerseObjects_);
    const newText = 'I am writing to you, Titus; you have become like a real son too me because we both now believe in Jesus the Messiah. May God the Father and the Messiah Jesus who saves us continue to be kind to you and to give you a peaceful spirit.\n\\p\n';
    const results = updateAlignmentsToTargetVerse(initialVerseObjects, newText)
    const expectedFinalAlign = alignedInitialVerseText;
    expect(results.targetVerseText).toMatchSnapshot()
  });

  test('should pass alignment with half of verse deleted', () => {
    const initialVerseObjects = _.cloneDeep(initialVerseObjects_);
    const newText = 'I am writing to you, Titus; you have become like a real son to me because we both now believe in Jesus the Messiah.';
    const results = updateAlignmentsToTargetVerse(initialVerseObjects, newText)
    const expectedFinalAlign = alignedInitialVerseText;
    expect(results.targetVerseText).toMatchSnapshot()
  });

  test('should pass alignment with half of verse replaced', () => {
    const initialVerseObjects = _.cloneDeep(initialVerseObjects_);
    const newText = 'I am writing to you, Titus; you have become like a real son to me because we both now believe in Jesus the Messiah.  How are you doing man? Wish I could come see you';
    const results = updateAlignmentsToTargetVerse(initialVerseObjects, newText)
    const expectedFinalAlign = alignedInitialVerseText;
    expect(results.targetVerseText).toMatchSnapshot()
  });

  test('should pass alignment with all text removed', () => {
    const initialVerseObjects = _.cloneDeep(initialVerseObjects_);
    const newText = '';
    const results = updateAlignmentsToTargetVerse(initialVerseObjects, newText)
    const expectedFinalAlign = '';
    expect(results.targetVerseText).toEqual(expectedFinalAlign)
  });

  test('should pass alignment with unaligned initial verse', () => {
    const initialText = 'unaligned verse';
    const initialVerseObjects = usfmVerseToJson(initialText);
    const newText = initialText;
    const results = updateAlignmentsToTargetVerse(initialVerseObjects, newText)
    const expectedFinalAlign = '\\w unaligned|x-occurrence=\"1\" x-occurrences=\"1\"\\w* \\w verse|x-occurrence=\"1\" x-occurrences=\"1\"\\w*';
    expect(results.targetVerseText).toEqual(expectedFinalAlign)
  });

  test('should pass alignment with unaligned initial verse and changed', () => {
    const initialVerseObjects = usfmVerseToJson('unaligned verse');
    const newText = 'furby furry';
    const results = updateAlignmentsToTargetVerse(initialVerseObjects, newText)
    const expectedFinalAlign = '\\w furby|x-occurrence=\"1\" x-occurrences=\"1\"\\w* \\w furry|x-occurrence=\"1\" x-occurrences=\"1\"\\w*';
    expect(results.targetVerseText).toEqual(expectedFinalAlign)
  });

  test('should pass alignment with "/p" removed', () => {
    const initialVerseObjects = _.cloneDeep(initialVerseObjects_);
    const newText = 'I am writing to you, Titus; you have become like a real son to me because we both now believe in Jesus the Messiah. May God the Father and the Messiah Jesus who saves us continue to be kind to you and to give you a peaceful spirit.\n\n';
    const results = updateAlignmentsToTargetVerse(initialVerseObjects, newText)
    expect(results.targetVerseText).toMatchSnapshot()
  });
});

