import React, { useState, useEffect, useCallback } from "react";
import { API } from "aws-amplify";
import { Link } from "react-router-dom";
import { BsPencilSquare, BsSearch, BsArrowUpDown } from "react-icons/bs";
import ListGroup from "react-bootstrap/ListGroup";
import Spinner from 'react-bootstrap/Spinner';
import InputGroup from 'react-bootstrap/InputGroup';
import FormControl from 'react-bootstrap/FormControl';
import Button from 'react-bootstrap/Button';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import Modal from 'react-bootstrap/Modal';
import ProgressBar from 'react-bootstrap/ProgressBar';
import { LinkContainer } from "react-router-bootstrap";
import { useAppContext } from "../libs/contextLib";
import { onError } from "../libs/errorLib";
import "./Home.css";

export default function Home() {
  const [notes, setNotes] = useState([]);
  const [replacementComplete, setReplacementComplete] = useState(true);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [searchTerm, setSearchTerm] = useState(null);
  const [replaceTerm, setReplaceTerm] = useState(null);
  const { isAuthenticated } = useAppContext();
  const [isLoading, setIsLoading] = useState(true);

  const showReplace = searchTerm && filteredNotes.length > 0; // Only show the replace field if there are valid notes to replace things with

  const reloadNotes = useCallback(async () => {
    try {
      const notes = await loadNotes();
      setNotes(notes);
      setFilteredNotes(notes);
      setReplaceTerm(null);
      setSearchTerm(null);
    } catch (e) {
      onError(e);
    }
  }, [])

  useEffect(() => {
    async function onLoad() {
      if (!isAuthenticated) {
        return;
      }
      await reloadNotes();
      setIsLoading(false);
    }

    onLoad();
  }, [isAuthenticated, reloadNotes]);

  function setSearch(event) {
    const searchTerm = event.target.value;
    setSearchTerm(event.target.value);

    // If nothing is enetered in the search box, reset the filter
    if (!searchTerm) {
      setFilteredNotes(notes);
      return;
    }

    // Use simple client side filter 
    // Could add a debounce here if performace is an issue
    setFilteredNotes(notes.filter(({ content }) => (content || '').indexOf(searchTerm) > -1))

  }

  function loadNotes() {
    return API.get("notes", "/notes");
  }

  function renderNotesList(notes) {
    return (
      <>
        <LinkContainer to="/notes/new">
          <ListGroup.Item action className="py-3 text-nowrap text-truncate">
            <BsPencilSquare size={17} />
            <span className="ml-2 font-weight-bold">Create a new note</span>
          </ListGroup.Item>
        </LinkContainer>
        {isLoading ?
          <ListGroup.Item>
            {
              // Show loading spinner inside the notes list while notes are still loading.
              // This is better than a full screen loading spinner because we aren't blocking the rest of the page paint
            }
            <span className="font-weight-bold">
              <Spinner animation="border" />
            </span>
            <br />
            <span className="text-muted">
              Loading Your Notes...
              </span>
          </ListGroup.Item>
          :
          notes.map(({ noteId, content, createdAt }) => (
            <LinkContainer key={noteId} to={`/notes/${noteId}`}>
              <ListGroup.Item action>
                <span className="font-weight-bold">
                  {showReplace ? <SearchAndReplaceText text={content} searchTerm={searchTerm} replaceTerm={replaceTerm} /> : (content || '').trim().split("\n")[0]}
                </span>
                <br />
                <span className="text-muted">
                  Created: {new Date(createdAt).toLocaleString()}
                </span>
              </ListGroup.Item>
            </LinkContainer>
          ))
        }
      </>
    );
  }

  function renderLander() {
    return (
      <div className="lander">
        <h1>Scratch</h1>
        <p className="text-muted">A simple note taking app</p>
        <div className="pt-3">
          <Link to="/login" className="btn btn-info btn-lg mr-3">
            Login
          </Link>
          <Link to="/signup" className="btn btn-success btn-lg">
            Signup
          </Link>
        </div>
      </div>
    );
  }

  function renderNotes() {
    return (
      <div className="notes">
        <h2 className="pb-3 mt-4 mb-3 border-bottom">Your Notes</h2>
        <InputGroup className="mb-3">
          <InputGroup.Prepend>
            <InputGroup.Text id="search-mag"><BsSearch /></InputGroup.Text>
          </InputGroup.Prepend>
          {replacementComplete && <FormControl
            placeholder="Search your notes..."
            aria-label="Search"
            aria-describedby="search-mag"
            onChange={setSearch}
          />}
        </InputGroup>
        {showReplace &&
          <InputGroup className="mb-3">
            <InputGroup.Prepend>
              <OverlayTrigger
                placement='bottom'
                overlay={<Tooltip>Replace</Tooltip>}
              >
                <Button
                  id="search-replace"
                  onClick={() => setReplacementComplete(false)}
                ><BsArrowUpDown /></Button>
              </OverlayTrigger>
            </InputGroup.Prepend>
            <FormControl
              placeholder={`Replace "${searchTerm}" with...`}
              aria-label="Replace"
              aria-describedby="search-replace"
              onChange={event => setReplaceTerm(event.target.value)}
            />
            {!replacementComplete && <ReplacementProgress notesToReplace={filteredNotes} searchTerm={searchTerm} replaceTerm={replaceTerm} setReplacementComplete={setReplacementComplete} reloadNotes={reloadNotes} />}
          </InputGroup>
        }
        <ListGroup>{renderNotesList(filteredNotes)}</ListGroup>
      </div>
    );
  }

  return (
    <div className="Home">
      {isAuthenticated ? renderNotes() : renderLander()}
    </div>
  );
}

/**
 * When searching for text, highlight the search term
 * When replacing text, strikeout the text and show the replacement text highlighted next to it
 */
function SearchAndReplaceText({ text, searchTerm, replaceTerm }) {
  const searchTermHighlight = replaceTerm ? <del>{searchTerm}</del> : <mark>{searchTerm}</mark> // If there is a replacement term, then strike out the search term. Otherwise highlight it
  const replaceTermHighlight = replaceTerm ? <mark>{replaceTerm}</mark> : null // If there is a replacement term, highlight it

  return (
    <>{text.split("\n").map(line => // Split text into paragrapghs to render the full note on the screen and not just the first line
      <p>
        {line.split(searchTerm).map((text, index, array) => // Split the line by the search term in order to highlight the search term
          <>
            {text}
            {index < array.length - 1 && searchTermHighlight /* Don't reinsert the search term on the last split */}
            {index < array.length - 1 && replaceTermHighlight /* Don't insert the replace term on the last split */}
          </>
        )}
      </p>
    )}
    </>
  );
}

/**
 * Show confirmation box when replacing text
 * When updating the notes, show a progress bar
 */
function ReplacementProgress({ notesToReplace, searchTerm, replaceTerm, setReplacementComplete, reloadNotes }) {
  const [replacementProgress, setReplacementProgress] = useState(-1);

  const startReplacement = useCallback(async () => {
    setReplacementProgress(0);
    await Promise.all(notesToReplace.map(async ({ noteId, content, attachment }, index) => {
      await API.put("notes", `/notes/${noteId}`, {
        body: {
          content: (content || '').replaceAll(searchTerm, (replaceTerm || ' ')),
          attachment
        }
      });
      setReplacementProgress(index + 1)
    }));
    await reloadNotes();
    setReplacementComplete(true);
  }, [notesToReplace, reloadNotes, setReplacementComplete, searchTerm, replaceTerm]);

  return (
    <Modal
      show={true}
      onHide={() => setReplacementComplete(true)}
    >
      <Modal.Header closeButton>
        <Modal.Title>Replace Text</Modal.Title>
      </Modal.Header>

      {replacementProgress < 0 ?
        <>
          <Modal.Body>
            <p>Are you sure you want to replace <mark>{searchTerm}</mark> with <mark>{replaceTerm}</mark> in all your notes? </p>
            <p>This action will update {notesToReplace.length} notes.</p>
          </Modal.Body>

          <Modal.Footer>
            <Button variant="secondary" onClick={() => setReplacementComplete(true)}>Close</Button>
            <Button variant="primary" onClick={startReplacement}>Replace</Button>
          </Modal.Footer>
        </>
        :
        <Modal.Body>
          <p>Updating Notes...</p>
          <p><small>Please do not close this page</small></p>
          <ProgressBar now={Math.round(replacementProgress * 100 / notesToReplace.length)} label={`${replacementProgress}/${notesToReplace.length}`} />
        </Modal.Body>
      }
    </Modal>
  );
}
