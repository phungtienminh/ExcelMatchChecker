import React, { Fragment, useState } from 'react'
import CONSTANTS from '../utils/Constants';
import axios from 'axios';

const FileUpload = () => {
    const [file, setFile] = useState('');
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState([]);
    const [abortMessage, setAbortMessage] = useState('');
    const [successAlert, setSuccessAlert] = useState('');

    const onChange = (e) => {
        setFile(e.target.files[0]);
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        if (file === '') {
            setAbortMessage('Please include a file to submit');
            return;
        }

        setAbortMessage('');
        setSuccessAlert('');
        setMessages([]);
        setLoading(true);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await axios.post(`${CONSTANTS.BACKEND_API_URL}/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (res.status !== 200) {
                setAbortMessage('Some errors have occurred. Please try again.');
            } else {
                setSuccessAlert('Successfully uploaded');
                setMessages(res.data.msg);
            }

            setLoading(false);
        } catch (err) {
            setAbortMessage('Unknown errors occurred.');
            setLoading(false);
        }
    };

    return (
        <Fragment>
            {successAlert !== '' && <div className="alert alert-success" role="alert">{successAlert}</div>}
            {abortMessage !== '' && <div className="alert alert-danger" role="alert">{abortMessage}</div>}
            <form onSubmit={onSubmit} className="d-grid justify-content-center">
                <div className="mb-3">
                    <label htmlFor="formFile" className="form-label">Choose File</label>
                    <input className="form-control" type="file" id="formFile" onChange={onChange}/>
                </div>

                <input type="submit" value="Upload" className="btn btn-primary btn-block mt-4" />
            </form>
            {loading && (<div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>)
            }
            {messages !== null && typeof messages !== 'undefined' && messages.length > 0 && 
                <ul>
                    {messages.map((message, i) => (
                        <li key={i} className="list-group-item mt-2">
                            {message.type === 'Success' ? (
                                <div className="alert alert-success" role="alert">
                                    {message.content}
                                </div>
                            ) : (
                                <div className="alert alert-danger" role="alert">
                                    {message.content}
                                </div>
                            )}
                        </li>
            ))}
                </ul>
            }
        </Fragment>
    )
}

export default FileUpload