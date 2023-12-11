import { useEffect, useState, useRef } from "react"
import { useParams } from "react-router-dom"
import { AiOutlineLink, AiOutlineStar, AiOutlineEye, AiOutlineFork, AiFillFile, AiOutlineFileSearch, AiOutlineFileSync } from "react-icons/ai"
import { FaMedal } from "react-icons/fa"
import { RiFileWarningFill } from "react-icons/ri"
import Chart from 'chart.js/auto'
import moment from 'moment'
import axios from "axios"
import CircularPacking from "./circularPacking"

export default function Rank() {
    const [repo, setRepo] = useState([])
    const [languages, setLanguages] = useState([])
    const [commits, setCommits] = useState([])
    const [activeCommiter, setActiveCommiter] = useState("")
    const [commitAnalyses, setCommitAnalyses] = useState()
    const [commitersScore, setCommitersScore] = useState([])
    const { username, name } = useParams()
    const chartRef = useRef(null)
    const [data, setData] = useState()

    useEffect(() => {
        async function getData() {
            const githubToken = 'token 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'
            await axios.get(`https://api.github.com/repos/${username}/${name}`, {
                headers: {
                    Authorization: githubToken
                }
            }).then(response => {
                setRepo(response.data)
            })

            await axios.get(`https://api.github.com/repos/${username}/${name}/languages`, {
                headers: {
                    Authorization: githubToken
                }
            }).then(response => {
                setLanguages(Object.keys(response.data))
            })

            await axios.get(`https://api.github.com/repos/${username}/${name}/commits?per_page=100`, {
                headers: {
                    Authorization: githubToken
                }
            }).then(response => {
                const filteredCommits = response.data.filter(commit => commit.author !== null)
                setCommits(filteredCommits)
            })

            await axios.get(`http://localhost:3001/sonarAnalyses`)
                .then((response) => {
                    setCommitAnalyses(response.data)
                })
        }
        getData()
    }, [name, username])

    useEffect(() => {
        const commiters = commits.filter((obj, index) => {
            return index === commits.findIndex(o => obj.author.login === o.author.login)
        })

        const a = commits
        const d = commiters

        a.forEach((b) => {
            b.data = commitAnalyses.find(o => b.sha === o.component.name)
        })

        d.forEach((e) => {
            e.commits = a.filter(o => o.author.login === e.author.login && o.data !== undefined)
            delete e.data
        })

        const commitersCheck = commiters.map((commiter) => {
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
            const commiterCommits = commits.filter((o) => o.author.login === commiter.author.login)
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
                ((measure.minor_violations / measure.lines) * 1) +
                ((measure.major_violations / measure.lines) * 2) +
                ((measure.critical_violations / measure.lines) * 3) +
                ((measure.blocker_violations / measure.lines) * 4)
            )
            commiter.measure = measure
            return commiter
        })

        const commitersScore = commitersCheck.filter((o) => !isNaN(o.measure.score))

        commitersScore.sort((a, b) => {
            if (a.measure.score === b.measure.score) {
                return b.measure.lines - a.measure.lines;
            }
            return a.measure.score - b.measure.score;
        })
        setCommitersScore(commitersScore)
        // setData(commitersScore.map((c) => {
        //     return { name: c.commit.author.name, value: c.measure.lines, duplicate_lines: parseFloat(c.measure.duplicated_lines_density.toFixed(2)), bad_code: parseFloat(c.measure.score_percent.toFixed(2)) }
        // }))
        setData(d.map((c) => {
            return { name: c.commit.author.name, value: c.measure.lines, data: c.commits.filter(o => o.data !== undefined) }
        }))
    }, [commitAnalyses])

    const scrollToTop = () => {
        window.scrollTo(0, 210)
    }

    const getChart = async (commiter) => {
        if (chartRef.current) {
            chartRef.current.destroy()
        }

        const ctx = document.getElementById('graph')
        const commiterData = commitersScore.find((o) => o.author.login === commiter)
        const labels = ["Minor Bad Codes", "Major Bad Codes", "Critical Bad Codes", "Blocker Bad Codes"]
        const data = {
            labels: labels,
            datasets: [{
                label: "Bad Codes",
                data: [commiterData.measure.minor_violations, commiterData.measure.major_violations, commiterData.measure.critical_violations, commiterData.measure.blocker_violations],
                backgroundColor: [
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(255, 205, 86, 0.2)',
                    'rgba(255, 159, 64, 0.2)',
                    'rgba(255, 99, 132, 0.2)'
                ],
                borderColor: [
                    'rgb(75, 192, 192)',
                    'rgb(255, 205, 86)',
                    'rgb(255, 159, 64)',
                    'rgb(255, 99, 132)'
                ],
                borderWidth: 1
            }]
        }

        const newChart = new Chart(
            ctx,
            {
                type: 'bar',
                data: data
            }
        )

        chartRef.current = newChart
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
                <div className="d-flex flex-row pb-4">
                    <div className="d-flex flex-column col-3">
                        <div className="d-flex flex-row justify-content-between">
                            <p> <b>{commitersScore.length}</b> Commiters</p>
                        </div>

                        <div className="list-group">
                            <button onClick={() => {
                                setActiveCommiter("")
                            }} type="button" className={`list-group-item overflow-hidden d-flex flex-row align-items-center justify-content-between p-2 list-group-item-action ${activeCommiter === "" ? 'active' : ""}`}>
                                <span>Overall</span>
                            </button>
                            {commitersScore.map((commiter, index) => (
                                <button key={index} onClick={async () => {
                                    await setActiveCommiter(commiter.author.login)
                                    await scrollToTop()
                                    await getChart(commiter.author.login)
                                }} type="button" className={`list-group-item overflow-hidden d-flex flex-row align-items-center justify-content-between p-2 list-group-item-action ${commiter.author.login === activeCommiter ? "active" : ""}`}>
                                    <div className="d-flex flex-row align-items-center gap-3">
                                        <img className="followers-avatar" src={commiter.author.avatar_url} alt="" />
                                        <div className="d-flex flex-column">
                                            <small className="text-truncate">{commiter.commit.author.name}</small>
                                            <small className="text-truncate">Score: <b>{commiter.measure.score.toFixed(4)}</b></small>
                                            <small className="text-truncate">Lines of Code: <b>{commiter.measure.lines}</b></small>
                                        </div>
                                    </div>
                                    {
                                        index === 0 ?
                                            (<FaMedal className="fs-4 mx-4" style={{ color: 'gold' }}></FaMedal>)
                                            : index === 1 ?
                                                (<FaMedal className="fs-4 mx-4" style={{ color: 'grey' }}></FaMedal>)
                                                : index === 2 ?
                                                    (<FaMedal className="fs-4 mx-4" style={{ color: 'brown' }}></FaMedal>) : ""
                                    }
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="d-flex flex-column px-3 col">
                        <div className="d-flex flex-row justify-content-between">
                            <p>Commiter Graph</p>
                        </div>

                        {activeCommiter !== ""
                            ?
                            <div className="d-flex flex-column card">
                                <div className="card-header">
                                    <div className="d-flex flex-row justify-content-between">
                                        <span>{commitersScore.find((o) => o.author.login === activeCommiter).commit.author.name} Score</span>
                                        <div className="d-flex flex-row gap-3">
                                            <span>
                                                Good code score : <b>{commitersScore.find((o) => o.author.login === activeCommiter).measure.scoree.toFixed(3)}</b>
                                            </span>
                                            <span>
                                                Bad code score : <b>{commitersScore.find((o) => o.author.login === activeCommiter).measure.score_percent.toFixed(3)} %</b>
                                            </span>
                                        </div>

                                    </div>
                                </div>
                                <div className="card-body p-3">
                                    <div className="d-flex flex-row gap-2">

                                        <div className="d-flex flex-column">
                                            <div className="p-1">
                                                <div className="card">
                                                    <div className="card-body p-2">
                                                        <span className="card-subtitle fw-medium">Total Scanned Files</span>
                                                        <div className="d-flex flex-row justify-content-between">
                                                            <span className="fs-5">
                                                                {commitersScore.find((o) => o.author.login === activeCommiter).measure.files}
                                                            </span>
                                                            <AiFillFile className="text-primary fs-4 mt-2"></AiFillFile>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="p-1">
                                                <div className="card">
                                                    <div className="card-body p-2">
                                                        <span className="card-subtitle fw-medium">Total Lines</span>
                                                        <div className="d-flex flex-row justify-content-between">
                                                            <span className="fs-5">
                                                                {commitersScore.find((o) => o.author.login === activeCommiter).measure.lines}
                                                            </span>
                                                            <AiOutlineFileSearch className="text-primary fs-4"></AiOutlineFileSearch>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="p-1">
                                                <div className="card">
                                                    <div className="card-body p-2">
                                                        <span className="card-subtitle fw-medium">Total Dupicate Lines</span>
                                                        <div className="d-flex flex-row justify-content-between">
                                                            <span className="fs-5">
                                                                {commitersScore.find((o) => o.author.login === activeCommiter).measure.duplicated_lines_density.toFixed(1)} %
                                                            </span>
                                                            <AiOutlineFileSync className="text-warning fs-4 mt-2"></AiOutlineFileSync>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            {/* <div className="p-1">
                                                <div className="card">
                                                    <div className="card-body p-2">
                                                        <span className="card-subtitle fw-medium">Total Complexity</span>
                                                        <div className="d-flex flex-row justify-content-between">
                                                            <span className="fs-5">
                                                                {commitersScore.find((o) => o.author.login === activeCommiter).measure.complexity}
                                                            </span>
                                                            <MdOutlineTimeline className="text-secondary fs-4"></MdOutlineTimeline>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div> */}
                                            <div className="p-1">
                                                <div className="card">
                                                    <div className="card-body p-2">
                                                        <span className="card-subtitle fw-medium">Total Bad Codes</span>
                                                        <div className="d-flex flex-row justify-content-between">
                                                            <span className="fs-5">
                                                                {commitersScore.find((o) => o.author.login === activeCommiter).measure.violations}
                                                            </span>
                                                            <RiFileWarningFill className="text-secondary fs-4"></RiFileWarningFill>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="graph col">
                                            <canvas id="graph"></canvas>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            :
                            <div className="card">
                                <div className="card-header">Circular Packing</div>
                                <div className="rounded-circle mx-auto p-2 m-3" style={{ backgroundColor: '#fceebb', border: '2px solid orange' }}>
                                    <CircularPacking data={data} width={500} height={500} />
                                </div>
                            </div>
                        }
                    </div>
                </div>
            </div>

        </div>
    )
}