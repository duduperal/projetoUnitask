import Sidebar from './Sidebar'
import styles from './Layout.module.css'

export default function Layout({ children }) {
  return (
    <div className={styles.wrapper}>
      <Sidebar />
      <main className={styles.main}>{children}</main>
    </div>
  )
}
