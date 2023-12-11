import axios from "axios"
import { useState } from "react"
import { useNavigate } from "react-router-dom"

export default function Index() {

    const [username, setUsername] = useState("")
    const [required, setRequired] = useState("d-none")
    const [message, setMessage] = useState("")
    const navigate = useNavigate()

    const submit = async (username) => {
        try {
            await axios.get(`https://api.github.com/users/${username}`)
            navigate(`/repos/${username}`)
        } catch (error) {
            if (error.response) {
                setMessage("Username not found!")
                setRequired("")
            } else if (error.request) {
                setMessage("Network connection lost!")
                setRequired("")
            } else {
                setMessage(error.message)
                setRequired("")
            }
        }
    }

    return (
        <div>

            <div className="index-form">
                <div className="d-flex flex-column col-5">
                    <div className="d-flex flex-row">
                        <div className="input-group has-validation mx-2">
                            <input onChange={(objekEvent) => {
                                setUsername(objekEvent.target.value)
                            }} type="text" className="form-control" placeholder="Input Github Username" id="validationCustomUsername" aria-describedby="inputGroupPrepend" />
                            <div className="invalid-feedback">
                                Please choose a username.
                            </div>
                        </div>
                        <div className="col">
                            <button onClick={() => {
                                if (username !== "") {
                                    submit(username)
                                } else {
                                    setMessage("Github username required!")
                                    setRequired("")
                                }
                            }} type="button" className="btn btn-primary">Submit</button>
                        </div>
                    </div>
                    <span className={`text-danger fst-italic mx-3 ${required}`}>{message}</span>
                </div>
            </div>
        </div>
    )
}