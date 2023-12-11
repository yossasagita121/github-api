import { useEffect, useState } from "react"
import { useAtom } from 'jotai'
import { repoIdAtom } from '../atoms'
import { useNavigate, useParams } from "react-router-dom"
import {
    AiOutlineLink,
    AiOutlineStar,
    AiOutlineEye,
    AiOutlineFork,
    AiFillFile,
    AiFillBug,
    AiOutlineFileSearch,
    AiOutlineFileSync,
    AiFillLock,
    AiFillWarning
} from "react-icons/ai"
import { PiWarningOctagonFill } from "react-icons/pi"
import { MdOutlineTimeline } from "react-icons/md"
import { RiFileWarningFill } from "react-icons/ri"
import moment from 'moment'
import axios from "axios"

export default function Statistic() {
    const navigate = useNavigate()
    const { username, name } = useParams()
    const [repoSha, setRepoSha] = useAtom(repoIdAtom)
    const [repoId, setRepoId] = useState()
    const [repo, setRepo] = useState("")
    const [languages, setLanguages] = useState([])
    const [commits, setCommits] = useState([])
    const [commit, setCommit] = useState()
    const [activeCommiter, setActiveCommiter] = useState("")
    const [activeCommit, setActiveCommit] = useState("")
    const [analyseLoading, setAnalyseLoading] = useState()
    const [commitAnalyses, setCommitAnalyses] = useState([])
    const [commitMeasures, setCommitMeasures] = useState()
    const [fileAnalyses, setFileAnalyses] = useState()

    useEffect(() => {
        const getData = async () => {
            await axios.get(`https://api.github.com/repos/${username}/${name}`)
                .then(response => {
                    setRepoId(response.data.id)
                    setRepo(response.data)
                })

            await axios.get(`https://api.github.com/repos/${username}/${name}/languages`)
                .then(response => {
                    setLanguages(Object.keys(response.data))
                })

            await axios.get(`https://api.github.com/repos/${username}/${name}/commits?per_page=50`)
                .then(response => {
                    const filteredCommits = response.data.filter(commit => commit.author !== null)
                    setCommits(filteredCommits)
                })
        }

        getData()

    }, [name, username])

    useEffect(() => {
        if (commits.length > 0) {
            setAnalyseLoading("a")
        }
    }, [commits])

    useEffect(() => {
        const fetchAnalyses = async () => {
            if (repoSha !== repoId) {
                setRepoSha(repoId)
                await axios.post('http://localhost:3001/githubCommit/repo', commits)
                await axios.get('http://localhost:3001/sonarAnalyses/analyse/repo')
                await new Promise(resolve => setTimeout(resolve, 30000))
            }

            await axios.get(`http://localhost:3001/sonarAnalyses`)
                .then((response) => {
                    setCommitAnalyses(response.data)
                    setAnalyseLoading("b")
                })
        }

        if (analyseLoading === "a") {
            fetchAnalyses()
        }
    }, [analyseLoading])

    const commiters = commits.filter((obj, index) => {
        return index === commits.findIndex(o => obj.author.login === o.author.login)
    })

    const fetchCommit = async (url, sha) => {
        const commitFiles = []
        let duplicate_lines = 0
        const measure = {
            files: 0,
            bugs: 0,
            lines: 0,
            vulnerabilities: 0,
            code_smells: 0,
            security_hotspots: 0,
            duplicated_lines_density: 0,
            violations: 0,
            minor_violations: 0,
            major_violations: 0,
            critical_violations: 0,
            blocker_violations: 0,
            score: 0,
            score_percent: 0,
            scoree: 0,
            not_duplicated_lines: 0,
            complexity: 0
        }

        await axios.get(url)
            .then((response) => {
                response.data.files.forEach((file) => {
                    commitFiles.push(file.sha)
                })
                setCommit(response.data)
            })

        await axios.get(`http://localhost:3001/sonarAnalyses/files/${sha}`)
            .then((response) => {
                if (response.data !== 'commitanalysesnotfound') {
                    commitFiles.forEach((fileSha) => {
                        const file = response.data.find((o) => o.component.name.substring(0, o.component.name.lastIndexOf('.')) === fileSha)
                        if (file) {
                            const bugs = file.component.measures.find((o) => o.metric === 'bugs')
                            const lines = file.component.measures.find((o) => o.metric === 'lines')
                            const vulnerabilities = file.component.measures.find((o) => o.metric === 'vulnerabilities')
                            const code_smells = file.component.measures.find((o) => o.metric === 'code_smells')
                            const security_hotspots = file.component.measures.find((o) => o.metric === 'security_hotspots')
                            const duplicated_lines_density = file.component.measures.find((o) => o.metric === 'duplicated_lines_density')
                            const violations = file.component.measures.find((o) => o.metric === 'violations')
                            const minor_violations = file.component.measures.find((o) => o.metric === 'minor_violations')
                            const major_violations = file.component.measures.find((o) => o.metric === 'major_violations')
                            const critical_violations = file.component.measures.find((o) => o.metric === 'critical_violations')
                            const blocker_violations = file.component.measures.find((o) => o.metric === 'blocker_violations')
                            const complexity = file.component.measures.find((o) => o.metric === 'complexity')

                            if (lines && duplicated_lines_density) {
                                duplicate_lines += +lines.value * (+duplicated_lines_density.value / 100)
                            }

                            measure.files++
                            measure.bugs += bugs ? +bugs.value : 0
                            measure.lines += lines ? +lines.value : 0
                            measure.vulnerabilities += vulnerabilities ? +vulnerabilities.value : 0
                            measure.code_smells += code_smells ? +code_smells.value : 0
                            measure.security_hotspots += security_hotspots ? +security_hotspots.value : 0
                            measure.violations += violations ? +violations.value : 0
                            measure.minor_violations += minor_violations ? +minor_violations.value : 0
                            measure.major_violations += major_violations ? +major_violations.value : 0
                            measure.critical_violations += critical_violations ? +critical_violations.value : 0
                            measure.blocker_violations += blocker_violations ? +blocker_violations.value : 0
                            measure.complexity += complexity ? +complexity.value : 0
                        }
                    })
                }
            })

        measure.duplicated_lines_density = (duplicate_lines / measure.lines) * 100

        measure.score = ((measure.minor_violations * 1) + (measure.major_violations * 2) + (measure.critical_violations * 3) + (measure.blocker_violations * 4)) / (measure.lines * 4)
        measure.score_percent = measure.score * 100

        measure.not_duplicated_lines = measure.lines - (measure.lines * (measure.duplicated_lines_density / 100))

        measure.scoree = 1 - (
            ((measure.minor_violations / measure.lines) * 1) +
            ((measure.major_violations / measure.lines) * 2) +
            ((measure.critical_violations / measure.lines) * 3) +
            ((measure.blocker_violations / measure.lines) * 4)
        )
        setFileAnalyses(measure)
    }

    const commiterMeasures = async (activeCommiter) => {
        let duplicate_lines = 0
        const measure = {
            commits: 0,
            files: 0,
            bugs: 0,
            lines: 0,
            vulnerabilities: 0,
            code_smells: 0,
            security_hotspots: 0,
            duplicated_lines_density: 0,
            violations: 0,
            minor_violations: 0,
            major_violations: 0,
            critical_violations: 0,
            blocker_violations: 0,
            score: 0,
            score_percent: 0,
            scoree: 0,
            not_duplicated_lines: 0,
            complexity: 0
        }

        const commiterCommits = commits.filter((o) => o.author.login === activeCommiter)

        commiterCommits.forEach((commit) => {
            const commitMeasures = commitAnalyses.find((o) => o.component.name === commit.sha)

            if (commitMeasures) {
                const bugs = commitMeasures.component.measures.find((o) => o.metric === 'bugs')
                const lines = commitMeasures.component.measures.find((o) => o.metric === 'lines')
                const files = commitMeasures.component.measures.find((o) => o.metric === 'files')
                const vulnerabilities = commitMeasures.component.measures.find((o) => o.metric === 'vulnerabilities')
                const code_smells = commitMeasures.component.measures.find((o) => o.metric === 'code_smells')
                const security_hotspots = commitMeasures.component.measures.find((o) => o.metric === 'security_hotspots')
                const duplicated_lines_density = commitMeasures.component.measures.find((o) => o.metric === 'duplicated_lines_density')
                const violations = commitMeasures.component.measures.find((o) => o.metric === 'violations')
                const minor_violations = commitMeasures.component.measures.find((o) => o.metric === 'minor_violations')
                const major_violations = commitMeasures.component.measures.find((o) => o.metric === 'major_violations')
                const critical_violations = commitMeasures.component.measures.find((o) => o.metric === 'critical_violations')
                const blocker_violations = commitMeasures.component.measures.find((o) => o.metric === 'blocker_violations')
                const complexity = commitMeasures.component.measures.find((o) => o.metric === 'complexity')

                if (lines && duplicated_lines_density) {
                    duplicate_lines += +lines.value * (+duplicated_lines_density.value / 100)
                }

                measure.commits++
                measure.bugs += bugs ? +bugs.value : 0
                measure.lines += lines ? +lines.value : 0
                measure.files += files ? +files.value : 0
                measure.vulnerabilities += vulnerabilities ? +vulnerabilities.value : 0
                measure.code_smells += code_smells ? +code_smells.value : 0
                measure.security_hotspots += security_hotspots ? +security_hotspots.value : 0
                measure.duplicated_lines_density += duplicated_lines_density ? +duplicated_lines_density.value : 0
                measure.violations += violations ? +violations.value : 0
                measure.minor_violations += minor_violations ? +minor_violations.value : 0
                measure.major_violations += major_violations ? +major_violations.value : 0
                measure.critical_violations += critical_violations ? +critical_violations.value : 0
                measure.blocker_violations += blocker_violations ? +blocker_violations.value : 0
                measure.complexity += complexity ? +complexity.value : 0
            }
        })

        measure.duplicated_lines_density = (duplicate_lines / measure.lines) * 100
        measure.score = ((measure.minor_violations * 1) + (measure.major_violations * 2) + (measure.critical_violations * 3) + (measure.blocker_violations * 4)) / (measure.lines * 4)
        measure.score_percent = measure.score * 100
        measure.not_duplicated_lines = measure.lines - (measure.lines * (measure.duplicated_lines_density / 100))
        measure.scoree = 1 - (
            ((measure.minor_violations / measure.not_duplicated_lines) * 1) +
            ((measure.major_violations / measure.not_duplicated_lines) * 2) +
            ((measure.critical_violations / measure.not_duplicated_lines) * 3) +
            ((measure.blocker_violations / measure.not_duplicated_lines) * 4)
        )
        setCommitMeasures(measure)
    }

    return (
        <div>

            <div className="d-flex flex-column p-4 gap-4">
                <div className="d-flex flex-column card overflow-hidden">
                    <div className="card-header p-3"></div>
                    <div className="d-flex flex-row">
                        <div className="d-flex flex-column justify-content-center card-body">
                            <h4 className="card-title m-0">{repo.name}</h4>
                            <div className="d-flex flex-row justify-content-between mt-2">
                                <p className="card-text m-0 mb-2">{repo.description}</p>
                                <div className="d-flex flex-row">
                                    <p className="card-text m-0"><AiOutlineStar className="mb-1" /> {repo.stargazers_count}</p>
                                    <p className="card-text m-0 px-3"><AiOutlineEye className="mb-1" /> {repo.watchers_count}</p>
                                    <p className="card-text m-0"><AiOutlineFork className="mb-1" /> {repo.forks_count}</p>
                                </div>
                            </div>

                            <div className="d-flex flex-row justify-content-between">
                                <p className="card-text m-0 mb-1">
                                    <small className="text-body-secondary"><AiOutlineLink /> <a href={repo.html_url} className="text-decoration-none" target="blank">{repo.html_url}</a></small>
                                </p>

                                <div className="d-flex flex-row">
                                    {languages.map((language, index) => (
                                        <small key={index}><i className="text-body-secondary mx-1">{language}</i></small>
                                    ))}
                                </div>

                            </div>

                            <div className="d-flex flex-row">
                                <small>
                                    <i>Created Date : {moment(repo.created_at).format('D MMMM YYYY')}</i>
                                </small>
                                <div className="mx-2"></div>
                                <small>
                                    <i>Last Updated : {moment(repo.updated_at).format('D MMMM YYYY')}</i>
                                </small>
                            </div>
                        </div>
                    </div>
                </div>

                {analyseLoading === "b" ?
                    <div className="d-flex flex-row pb-4">
                        <div className="d-flex flex-column col-2">
                            <div className="d-flex flex-row justify-content-between">
                                <p> <b>{commiters.length}</b> Commiters</p>
                                <button onClick={() => navigate(`/rank/${username}/${name}`)} className="btn btn-link p-0 link-offset-2 link-underline link-underline-opacity-0">
                                    <p className="fw-medium">Rank</p>
                                </button>
                            </div>

                            <div className="list-group">
                                {commiters.map((commiter, index) => (
                                    <button key={index} onClick={() => {
                                        setActiveCommiter(commiter.author.login)
                                        commiterMeasures(commiter.author.login)
                                        setActiveCommit("")
                                    }} type="button" className={`list-group-item overflow-hidden list-group-item-action ${commiter.author.login === activeCommiter ? "active" : ""}`}>
                                        <small className="text-truncate">{commiter.commit.author.name}</small>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="d-flex flex-column px-3 col-3">
                            <p><b>{activeCommiter !== "" ? commits.filter((commit => commit.author.login === activeCommiter)).length : ""}</b> Commits</p>

                            <div className="d-flex flex-column card">
                                {activeCommiter !== "" ?
                                    <>
                                        <div className="card-header">{commiters.find(o => o.author.login === activeCommiter).commit.author.name}</div>
                                        <ul className="list-group list-group-flush">
                                            <button onClick={() => {
                                                setActiveCommit("")
                                            }} type="button" className={`list-group-item list-group-item-action d-flex flex-column ${activeCommit === "" ? "active" : ""}`}>
                                                <small className="mb-1 col-md-12 text-truncate">Overall Statistic</small>
                                            </button>
                                            {commits.map((commit, index) => (
                                                commit.author.login === activeCommiter && (
                                                    <button key={index} onClick={async () => {
                                                        await fetchCommit(commit.url, commit.sha)
                                                        setActiveCommit(commit.sha)
                                                    }} type="button" className={`list-group-item overflow-hidden list-group-item-action d-flex flex-column ${commit.sha === activeCommit ? "active" : ""}`}>
                                                        <small className="mb-1 col-md-11 text-truncate">{commit.commit.message}</small>
                                                        <div className="d-flex flex-row justify-content-end w-100">
                                                            <small>
                                                                <i>{moment(commit.commit.author.date).format('D MMMM YYYY')}</i>
                                                            </small>
                                                        </div>
                                                    </button>
                                                )
                                            ))}
                                        </ul>
                                    </>
                                    :
                                    <div className="card-header">Please pick a commiter!</div>
                                }
                            </div>
                        </div>

                        {activeCommiter !== "" ?
                            <div className="d-flex flex-column pl-3 col-7">
                                <p>Statistics by SonarQube</p>

                                {activeCommit !== ""
                                    ? fileAnalyses.files > 0
                                        ?
                                        <div className="d-flex flex-column card">
                                            <div className="card-header d-flex flex-row justify-content-between">
                                                <span className="text-truncate overflow-hidden m-0">Commit Score</span>
                                                <div className="d-flex flex-row gap-3">
                                                    <span>Good code score : <b>{fileAnalyses.scoree.toFixed(4)}</b></span>
                                                    <span>Bad codes score : <b>{fileAnalyses.score_percent.toFixed(2)} %</b></span>
                                                </div>
                                            </div>
                                            <div className="card-body p-3">
                                                <div className="row m-0">
                                                    <div className="col-4 p-2">
                                                        <div className="card">
                                                            <div className="card-body">
                                                                <h6 className="card-subtitle">Total Scanned Files</h6>
                                                                <div className="d-flex flex-row justify-content-between">
                                                                    <span className="fs-4">
                                                                        {fileAnalyses.files}
                                                                    </span>
                                                                    <AiFillFile className="text-primary fs-4 mt-2"></AiFillFile>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-4 p-2">
                                                        <div className="card">
                                                            <div className="card-body">
                                                                <h6 className="card-subtitle">Total Bugs</h6>
                                                                <div className="d-flex flex-row justify-content-between">
                                                                    <span className="fs-4">
                                                                        {fileAnalyses.bugs}
                                                                    </span>
                                                                    <AiFillBug className="text-danger fs-4 mt-2"></AiFillBug>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-4 p-2">
                                                        <div className="card">
                                                            <div className="card-body">
                                                                <h6 className="card-subtitle">Total Code Smells</h6>
                                                                <div className="d-flex flex-row justify-content-between">
                                                                    <span className="fs-4">
                                                                        {fileAnalyses.code_smells}
                                                                    </span>
                                                                    <PiWarningOctagonFill className="text-warning fs-4 mt-2"></PiWarningOctagonFill>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-4 p-2">
                                                        <div className="card">
                                                            <div className="card-body">
                                                                <h6 className="card-subtitle">Total Dupicate Lines</h6>
                                                                <div className="d-flex flex-row justify-content-between">
                                                                    <span className="fs-4">
                                                                        {fileAnalyses.duplicated_lines_density.toFixed(1)} %
                                                                    </span>
                                                                    <AiOutlineFileSync className="text-warning fs-4 mt-2"></AiOutlineFileSync>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-4 p-2">
                                                        <div className="card">
                                                            <div className="card-body">
                                                                <h6 className="card-subtitle">Total Lines</h6>
                                                                <div className="d-flex flex-row justify-content-between">
                                                                    <span className="fs-4">
                                                                        {fileAnalyses.lines}
                                                                    </span>
                                                                    <AiOutlineFileSearch className="text-primary fs-4 mt-2"></AiOutlineFileSearch>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* <div className="col-4 p-2">
                                                        <div className="card">
                                                            <div className="card-body">
                                                                <h6 className="card-subtitle">Total Security Hotspots</h6>
                                                                <div className="d-flex flex-row justify-content-between">
                                                                    <span className="fs-4">
                                                                        {fileAnalyses.security_hotspots}
                                                                    </span>
                                                                    <MdOutlineSecurity className="text-secondary fs-4 mt-2"></MdOutlineSecurity>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-4 p-2">
                                                        <div className="card">
                                                            <div className="card-body">
                                                                <h6 className="card-subtitle">Total Vulnerabilities</h6>
                                                                <div className="d-flex flex-row justify-content-between">
                                                                    <span className="fs-4">
                                                                        {fileAnalyses.vulnerabilities}
                                                                    </span>
                                                                    <AiFillLock className="text-secondary fs-4 mt-2"></AiFillLock>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div> */}
                                                    {/* <div className="col-4 p-2">
                                                        <div className="card">
                                                            <div className="card-body">
                                                                <h6 className="card-subtitle">Total Complexity</h6>
                                                                <div className="d-flex flex-row justify-content-between">
                                                                    <span className="fs-4">
                                                                        {fileAnalyses.complexity}
                                                                    </span>
                                                                    <AiFillLock className="text-secondary fs-4 mt-2"></AiFillLock>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div> */}
                                                    <div className="col-4 p-2">
                                                        <div className="card">
                                                            <div className="card-body">
                                                                <h6 className="card-subtitle">Total Bad Codes</h6>
                                                                <div className="d-flex flex-row justify-content-between">
                                                                    <span className="fs-4">{fileAnalyses.violations}</span>
                                                                    <RiFileWarningFill className="text-secondary fs-4 mt-2"></RiFileWarningFill>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-4 p-2">
                                                        <div className="card">
                                                            <div className="card-body">
                                                                <h6 className="card-subtitle">Total Minor Bad Codes</h6>
                                                                <div className="d-flex flex-row justify-content-between">
                                                                    <span className="fs-4">{fileAnalyses.minor_violations}</span>
                                                                    <AiFillWarning className="text-secondary fs-4 mt-2 text-danger"></AiFillWarning>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-4 p-2">
                                                        <div className="card">
                                                            <div className="card-body">
                                                                <h6 className="card-subtitle">Total Major Bad Codes</h6>
                                                                <div className="d-flex flex-row justify-content-between">
                                                                    <span className="fs-4">{fileAnalyses.major_violations}</span>
                                                                    <AiFillWarning className="text-secondary fs-4 mt-2 text-danger"></AiFillWarning>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-4 p-2">
                                                        <div className="card">
                                                            <div className="card-body">
                                                                <h6 className="card-subtitle">Total Critical Bad Codes</h6>
                                                                <div className="d-flex flex-row justify-content-between">
                                                                    <span className="fs-4">{fileAnalyses.critical_violations}</span>
                                                                    <AiFillWarning className="text-secondary fs-4 mt-2 text-danger"></AiFillWarning>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-4 p-2">
                                                        <div className="card">
                                                            <div className="card-body">
                                                                <h6 className="card-subtitle">Total Blocker Bad Codes</h6>
                                                                <div className="d-flex flex-row justify-content-between">
                                                                    <span className="fs-4">{fileAnalyses.blocker_violations}</span>
                                                                    <AiFillWarning className="text-secondary fs-4 mt-2 text-danger"></AiFillWarning>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                </div>
                                            </div>
                                        </div>
                                        :
                                        <div className="d-flex flex-column card">
                                            <div className="card-header">
                                                <p className="text-truncate overflow-hidden m-0">Message : <i>{commit.commit.message}</i></p>
                                            </div>
                                            <div className="card-body p-3">
                                                <span className="fw-medium text-danger"><i>Sonarqube unable to scan this commit files</i></span>
                                            </div>
                                        </div>
                                    :
                                    commitMeasures.commits > 0
                                        ?
                                        <div className="d-flex flex-column card">
                                            <div className="card-header d-flex flex-row justify-content-between">
                                                <span>Overall Score</span>
                                                <div className="d-flex flex-row gap-3">
                                                    <span>Good code score : <b>{commitMeasures.scoree.toFixed(4)}</b></span>
                                                    <span>Bad codes score : <b>{commitMeasures.score_percent.toFixed(2)} %</b></span>
                                                </div>
                                            </div>
                                            <div className="card-body p-3">
                                                <div className="row m-0">

                                                    <div className="col-4 p-2">
                                                        <div className="card">
                                                            <div className="card-body">
                                                                <h6 className="card-subtitle">Total Scanned Files</h6>
                                                                <div className="d-flex flex-row justify-content-between">
                                                                    <span className="fs-4">
                                                                        {commitMeasures.files}
                                                                    </span>
                                                                    <AiFillFile className="text-primary fs-4 mt-2"></AiFillFile>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-4 p-2">
                                                        <div className="card">
                                                            <div className="card-body">
                                                                <h6 className="card-subtitle">Total Bugs</h6>
                                                                <div className="d-flex flex-row justify-content-between">
                                                                    <span className="fs-4">{commitMeasures.bugs}</span>
                                                                    <AiFillBug className="text-danger fs-4 mt-2"></AiFillBug>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-4 p-2">
                                                        <div className="card">
                                                            <div className="card-body">
                                                                <h6 className="card-subtitle">Total Code Smells</h6>
                                                                <div className="d-flex flex-row justify-content-between">
                                                                    <span className="fs-4">{commitMeasures.code_smells}</span>
                                                                    <PiWarningOctagonFill className="text-warning fs-4 mt-2"></PiWarningOctagonFill>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-4 p-2">
                                                        <div className="card">
                                                            <div className="card-body">
                                                                <h6 className="card-subtitle">Total Dupicate Lines</h6>
                                                                <div className="d-flex flex-row justify-content-between">
                                                                    <span className="fs-4">{commitMeasures.duplicated_lines_density.toFixed(1)} %</span>
                                                                    <AiOutlineFileSync className="text-warning fs-4 mt-2"></AiOutlineFileSync>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-4 p-2">
                                                        <div className="card">
                                                            <div className="card-body">
                                                                <h6 className="card-subtitle">Total Lines</h6>
                                                                <div className="d-flex flex-row justify-content-between">
                                                                    <span className="fs-4">{commitMeasures.lines}</span>
                                                                    <AiOutlineFileSearch className="text-primary fs-4 mt-2"></AiOutlineFileSearch>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* <div className="col-4 p-2">
                                                        <div className="card">
                                                            <div className="card-body">
                                                                <h6 className="card-subtitle">Total Security Hotspots</h6>
                                                                <div className="d-flex flex-row justify-content-between">
                                                                    <span className="fs-4">{commitMeasures.security_hotspots}</span>
                                                                    <MdOutlineSecurity className="text-secondary fs-4 mt-2"></MdOutlineSecurity>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-4 p-2">
                                                        <div className="card">
                                                            <div className="card-body">
                                                                <h6 className="card-subtitle">Total Vulnerabilities</h6>
                                                                <div className="d-flex flex-row justify-content-between">
                                                                    <span className="fs-4">{commitMeasures.vulnerabilities}</span>
                                                                    <AiFillLock className="text-secondary fs-4 mt-2"></AiFillLock>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div> */}
                                                    {/* <div className="col-4 p-2">
                                                        <div className="card">
                                                            <div className="card-body">
                                                                <h6 className="card-subtitle">Total Complexity</h6>
                                                                <div className="d-flex flex-row justify-content-between">
                                                                    <span className="fs-4">{commitMeasures.complexity}</span>
                                                                    <MdOutlineTimeline className="text-secondary fs-4 mt-2"> </MdOutlineTimeline >
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div> */}
                                                    <div className="col-4 p-2">
                                                        <div className="card">
                                                            <div className="card-body">
                                                                <h6 className="card-subtitle">Total Bad Codes</h6>
                                                                <div className="d-flex flex-row justify-content-between">
                                                                    <span className="fs-4">{commitMeasures.violations}</span>
                                                                    <RiFileWarningFill className="text-secondary fs-4 mt-2"></RiFileWarningFill>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-4 p-2">
                                                        <div className="card">
                                                            <div className="card-body">
                                                                <h6 className="card-subtitle">Total Minor Bad Codes</h6>
                                                                <div className="d-flex flex-row justify-content-between">
                                                                    <span className="fs-4">{commitMeasures.minor_violations}</span>
                                                                    <AiFillWarning className="text-secondary fs-4 mt-2 text-danger"></AiFillWarning>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-4 p-2">
                                                        <div className="card">
                                                            <div className="card-body">
                                                                <h6 className="card-subtitle">Total Major Bad Codes</h6>
                                                                <div className="d-flex flex-row justify-content-between">
                                                                    <span className="fs-4">{commitMeasures.major_violations}</span>
                                                                    <AiFillWarning className="text-secondary fs-4 mt-2 text-danger"></AiFillWarning>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-4 p-2">
                                                        <div className="card">
                                                            <div className="card-body">
                                                                <h6 className="card-subtitle">Total Critical Bad Codes</h6>
                                                                <div className="d-flex flex-row justify-content-between">
                                                                    <span className="fs-4">{commitMeasures.critical_violations}</span>
                                                                    <AiFillWarning className="text-secondary fs-4 mt-2 text-danger"></AiFillWarning>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-4 p-2">
                                                        <div className="card">
                                                            <div className="card-body">
                                                                <h6 className="card-subtitle">Total Blocker Bad Codes</h6>
                                                                <div className="d-flex flex-row justify-content-between">
                                                                    <span className="fs-4">{commitMeasures.blocker_violations}</span>
                                                                    <AiFillWarning className="text-secondary fs-4 mt-2 text-danger"></AiFillWarning>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                </div>
                                            </div>
                                        </div>
                                        :
                                        <div className="d-flex flex-column card">
                                            <div className="card-header">
                                                <p className="text-truncate overflow-hidden m-0"><i>Overall</i></p>
                                            </div>
                                            <div className="card-body p-3">
                                                <span className="fw-medium text-danger"><i>Sonarqube unable to scan this user commits</i></span>
                                            </div>
                                        </div>
                                }

                            </div>
                            :
                            ""
                        }
                    </div>
                    :
                    <div className="row justify-content-center">
                        <div className="spinner-border text-primary" style={{ width: "3rem", height: "3rem" }}>
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                }

            </div>

        </div>
    )
}