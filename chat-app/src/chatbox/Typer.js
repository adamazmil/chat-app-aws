import { useEffect, useState } from 'react'
import './Typer.scss'

function Typer (props) {
  const [str, setStr] = useState(null)

  useEffect(() => {
    if (props.typers.length === 1) {
      setStr(props.typers[0].typer + ' is')
    } else if (props.typers.length > 1) {
      setStr('Multiple people are')
    } else if (props.typers.length === 0) {
      setStr(null)
    }
  }, [props.typers])
  return (
    <div className='Typer'>
      {(str !== null) ? <p>{str} typing...</p> : null}
    </div>
  )
}

export default Typer
