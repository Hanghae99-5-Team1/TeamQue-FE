import { useQuery } from 'react-query';
import styled from 'styled-components';
import api from '../../api';
import { CardType } from '../../type';
import Card from './Card';

type CardListProps = {
	tabState: boolean;
};

const CardList = ({ tabState }: CardListProps) => {
	const { data: learnCards } = useQuery('learnCard', api.loadLearnCards);
	const { data: teachCards } = useQuery('teachCard', api.loadTeachCards);

	return (
		<Container>
			{tabState
				? learnCards &&
				  learnCards.map((card: CardType) => <Card key={card.id} {...card} />)
				: teachCards &&
				  teachCards.map((card: CardType) => <Card key={card.id} {...card} />)}
		</Container>
	);
};

export default CardList;

const Container = styled.div`
	width: 850px;
	height: 400px;
	overflow-x: scroll;
	white-space: nowrap;
	display: flex;
	padding-right: 10px;
	&::-webkit-scrollbar {
		height: 5px;
	}
	&::-webkit-scrollbar-thumb {
		border-radius: 10px;
		background-color: ${({ theme }) => theme.colors.scroll};
	}
	&::-webkit-scrollbar-thumb:hover {
		background-color: ${({ theme }) => theme.colors.scrollHover};
	}
`;
