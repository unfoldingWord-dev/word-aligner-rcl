import React, { Component } from 'react';
import PropTypes from 'prop-types';
// constants
import { getFontClassName } from '../common/fontUtils';
import * as types from '../common/WordCardTypes';
// components
import AlignmentCard from './AlignmentCard';
// helpers

const makeStyles = props => ({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    height: '100%',
    backgroundColor: '#ffffff',
    padding: '0px 10px 10px',
    overflowY: 'auto',
    flexGrow: 2,
    direction: props.sourceDirection,
    alignContent: 'flex-start',
  },
  warning: {
    padding: '20px',
    backgroundColor: '#ccc',
    display: 'inline-block',
  },
});

/**
 * Renders a grid of word/phrase alignments
 */
class AlignmentGrid extends Component {
  constructor(props) {
    super(props);
    this.onDrag = this.onDrag.bind(this);
    this.state = {
      draggedAlignment: -1,
      draggedPrimaryAlignment: -1,
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.reset) {
      this.setState({
        draggedAlignment: -1,
        draggedPrimaryAlignment: -1,
      });
    }
  }

  onDrag(token, alignmentIndex, dragFinished, isPrimary) {
    if (dragFinished) {
      this.setState({
        draggedAlignment: -1,
        draggedPrimaryAlignment: -1,
      });
    } else {
      this.setState({
        draggedAlignment: alignmentIndex,
        draggedPrimaryAlignment: isPrimary ? alignmentIndex : -1,
      });
      this.props.setDragToken(token);
    }
  }

  render() {
    const {
      translate,
      lexicons,
      sourceDirection,
      targetDirection,
      sourceStyle,
      alignments,
      contextId,
      isHebrew,
      showPopover,
      toolsSettings,
      loadLexiconEntry,
      targetLanguageFont,
      dragToken,
      dragItemType,
    } = this.props;

    if (!contextId) {
      return <div/>;
    }

    const styles = makeStyles(this.props);
    const draggedAlignment = dragToken ? this.state.draggedAlignment : -1;
    const targetLanguageFontClassName = getFontClassName(targetLanguageFont);
    const { fontSize } = toolsSettings['AlignmentGrid'] || {};

    if (fontSize) {
      styles.root.fontSize = `${fontSize}%`;
    }

    // TODO: add support for dragging to left of card. See utils/dragDrop.js
    return (
      <div id='AlignmentGrid' style={styles.root}>
        {
          alignments.map((alignment, key) => (
            <React.Fragment key={key}>
              <AlignmentCard
                translate={translate}
                sourceStyle={sourceStyle}
                sourceDirection={sourceDirection}
                targetDirection={targetDirection}
                alignmentIndex={alignment.index}
                isSuggestion={alignment.isSuggestion}
                targetNgram={alignment.targetNgram}
                sourceNgram={alignment.sourceNgram}
                onDrop={(item) => this.handleDrop(key, item, this.state.draggedAlignment)}
                lexicons={lexicons}
                isHebrew={isHebrew}
                showPopover={showPopover}
                loadLexiconEntry={loadLexiconEntry}
                fontSize={fontSize}
                targetLanguageFontClassName={targetLanguageFontClassName}
                dragToken={dragToken}
                dragItemType={dragItemType}
                setDragToken={(token, dragFinished, isPrimary) => this.onDrag(token, key, dragFinished, isPrimary)}
              />
              {/* placeholder for un-merging primary words */}
              <AlignmentCard
                translate={translate}
                sourceDirection={sourceDirection}
                targetDirection={targetDirection}
                alignmentIndex={alignment.index}
                isSuggestion={alignment.isSuggestion}
                placeholderPosition="right"
                targetNgram={[]}
                sourceNgram={[]}
                onDrop={(item) => this.handleDrop(key, item, this.state.draggedAlignment, true)}
                showPopover={showPopover}
                loadLexiconEntry={loadLexiconEntry}
                lexicons={lexicons}
                isHebrew={isHebrew}
                fontSize={fontSize}
                targetLanguageFontClassName={targetLanguageFontClassName}
                dragToken={dragToken}
                setDragToken={(token, dragFinished, isPrimary) => this.onDrag(token, key, dragFinished, isPrimary)}
                showAsDrop={this.getShowAsDrop(key, alignment)}
              />
            </React.Fragment>
          ))
        }
      </div>
    );
  }

  getShowAsDrop(key, alignment) {
    const isCurrentKey = this.state.draggedPrimaryAlignment === key;
    const moreTheOneItem = alignment.sourceNgram.length > 1;
    const showDrop = isCurrentKey && moreTheOneItem;
    return showDrop;
  }

  handleDrop(alignmentIndex, item, srcAlignmentIndex, startNew) {
    const { onDropTargetToken, onDropSourceToken } = this.props;

    if (Array.isArray(item)) {
      // drop selected tokens
      for (let i = 0; i < item.length; i++) {
        onDropTargetToken(item[i], alignmentIndex, -1);
      }
    } else if (item.type === types.PRIMARY_WORD) {
      onDropSourceToken(item, alignmentIndex, srcAlignmentIndex, startNew);
    } else { // drop single secondary token
      onDropTargetToken(item, alignmentIndex, srcAlignmentIndex);
    }

    this.setState({
      draggedAlignment: -1,
      draggedPrimaryAlignment: -1,
    });
  }
}

AlignmentGrid.propTypes = {
  reset: PropTypes.bool,
  onDropTargetToken: PropTypes.func.isRequired,
  onDropSourceToken: PropTypes.func.isRequired,
  sourceStyle: PropTypes.object.isRequired,
  alignments: PropTypes.array.isRequired,
  contextId: PropTypes.object,
  translate: PropTypes.func.isRequired,
  lexicons: PropTypes.object.isRequired,
  toolsSettings: PropTypes.object.isRequired,
  sourceDirection: PropTypes.oneOf(['ltr', 'rtl']),
  targetDirection: PropTypes.oneOf(['ltr', 'rtl']),
  isHebrew: PropTypes.bool.isRequired,
  showPopover: PropTypes.func.isRequired,
  loadLexiconEntry: PropTypes.func.isRequired,
  targetLanguageFont: PropTypes.string,
  dragToken: PropTypes.oneOf([PropTypes.object, PropTypes.array]),
  dragItemType: PropTypes.string,
  setDragToken: PropTypes.func.isRequired,
};

AlignmentGrid.defaultProps = {
  sourceDirection: 'ltr',
  targetDirection: 'ltr',
  sourceStyle: { fontSize: '100%' },
  reset: false,
};

export default AlignmentGrid;
