import styled from 'styled-components';
import Calendar from '../components/Calendar';
import Board from '../components/classhome/Board';
import ClassInfo from '../components/classhome/ClassInfo';

const ClassHome = () => {
	return (
		<Container>
			<LeftBox>
				<ClassInfo />
				<Calendar />
			</LeftBox>
			<Board />
		</Container>
	);
};

export default ClassHome;

const Container = styled.div`
	/* 사이즈 */
	width: 1200px;
	height: 850px;
	/* 레이아웃 */
	margin: 100px auto;
	display: flex;
	justify-content: space-between;
`;

const LeftBox = styled.div`
	/* 사이즈 */
	width: 280px;
	height: 850px;
	/* 레이아웃 */
	display: flex;
	flex-direction: column;
	justify-content: space-between;
`;


