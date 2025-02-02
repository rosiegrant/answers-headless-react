import { CompositionMethod, useComposedCssClasses } from '../../hooks/useComposedCssClasses';
import { CardProps } from '../../models/cardComponent';

export interface FaqCardConfig {
  showOrdinal?: boolean
}

export interface FaqCardProps extends CardProps {
  configuration: FaqCardConfig,
  customCssClasses?: FaqCardCssClasses,
  cssCompositionMethod?: CompositionMethod
}

export interface FaqCardCssClasses {
  container?: string,
  header?: string,
  body?: string,
  descriptionContainer?: string,
  ctaContainer?: string,
  cta1?: string,
  cta2?: string,
  ordinal?: string,
  title?: string
}

const builtInCssClasses: FaqCardCssClasses = {
  container: 'StandardCard flex flex-col justify-between border rounded-lg mt-4 p-4',
  header: 'flex text-gray-800',
  body: 'flex justify-end pt-2.5',
  descriptionContainer: 'w-full text-base',
  ctaContainer: 'flex flex-col justify-end ml-4',
  cta1: 'min-w-max bg-blue-600 text-white font-medium rounded-lg py-2 px-5',
  cta2: 'min-w-max bg-white text-blue-600 font-medium rounded-lg py-2 px-5 mt-2 border',
  ordinal: 'mr-1.5 text-lg font-medium',
  title: 'text-lg font-medium'
}

interface CtaData { 
  label: string,
  link: string,
  linkType: string
}

function isCtaData(data: unknown): data is CtaData {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  const expectedKeys = ['label', 'link', 'linkType'];
  return expectedKeys.every(key => {
    return key in data;
  });
}

/**
 * This Component renders the base result card.
 * 
 * @param props - An object containing the result itself.
 */
export function FaqCard(props: FaqCardProps): JSX.Element {
  const { configuration, result, customCssClasses, cssCompositionMethod } = props;
  const cssClasses = useComposedCssClasses(builtInCssClasses, customCssClasses, cssCompositionMethod);

  const cta1 = isCtaData(result.rawData.c_primaryCTA) ? result.rawData.c_primaryCTA : undefined;
  const cta2 = isCtaData(result.rawData.c_secondaryCTA) ? result.rawData.c_secondaryCTA : undefined;

  const answer = result.rawData.answer as any;

  // TODO (cea2aj) We need to handle the various linkType so these CTAs are clickable
  function renderCTAs(cta1?: CtaData, cta2?: CtaData) {
    return (<>
      {(cta1 ?? cta2) && 
        <div className={cssClasses.ctaContainer}>
          {cta1 && <button className={cssClasses.cta1}>{cta1.label}</button>}
          {cta2 && <button className={cssClasses.cta2}>{cta2.label}</button>}
        </div>
      }
    </>);
  }

  // TODO (cea2aj) Update this to render the ordinal once we get mocks from UX
  function renderOrdinal(index: number) {
    // return (
    //   <div className={cssClasses.ordinal}>{index}</div>
    // );
    return null;
  }

  function renderTitle(title: string) {
    return <div className={cssClasses.title}>{title}</div>
  }

  return (
    <div className={cssClasses.container}>
      <div className={cssClasses.header}>
        {configuration.showOrdinal && result.index && renderOrdinal(result.index)}
        {result.name && renderTitle(result.name)}
      </div>
      {(answer ?? cta1 ?? cta2) &&
        <div className={cssClasses.body}>
          {answer &&

          <div className={cssClasses.descriptionContainer}> 
            <span>{answer}</span>
          </div>}
          {renderCTAs(cta1, cta2)}
        </div>
      }
    </div>
  );
}